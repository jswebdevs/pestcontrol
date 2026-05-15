import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { MediaType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: config.get<string>('cloudinary.cloudName'),
      api_key: config.get<string>('cloudinary.apiKey'),
      api_secret: config.get<string>('cloudinary.apiSecret'),
      secure: true,
    });
  }

  signUpload(params: { folder?: string; resourceType?: 'image' | 'video' | 'raw' }) {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = params.folder || this.config.get<string>('cloudinary.folder') || 'uploads';
    const toSign: Record<string, string | number> = {
      timestamp,
      folder,
    };
    const signature = cloudinary.utils.api_sign_request(
      toSign,
      this.config.get<string>('cloudinary.apiSecret')!,
    );
    return {
      cloudName: this.config.get<string>('cloudinary.cloudName'),
      apiKey: this.config.get<string>('cloudinary.apiKey'),
      timestamp,
      folder,
      signature,
      resourceType: params.resourceType || 'image',
    };
  }

  async recordUpload(input: {
    publicId: string;
    url: string;
    resourceType: 'image' | 'video' | 'raw';
    format?: string;
    width?: number;
    height?: number;
    duration?: number;
    bytes?: number;
    folderId?: string | null;
    alt?: string;
    uploadedBy?: string;
  }) {
    const rt: MediaType =
      input.resourceType === 'video' ? 'VIDEO' : input.resourceType === 'raw' ? 'RAW' : 'IMAGE';
    return this.prisma.media.create({
      data: {
        publicId: input.publicId,
        url: input.url,
        resourceType: rt,
        format: input.format,
        width: input.width,
        height: input.height,
        duration: input.duration,
        bytes: input.bytes,
        folderId: input.folderId || null,
        alt: input.alt || null,
        uploadedBy: input.uploadedBy || null,
      },
    });
  }

  async list(params: {
    folderId?: string | null;
    resourceType?: MediaType;
    tag?: string;
    q?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 30;
    const where: Prisma.MediaWhereInput = {};
    if (params.folderId !== undefined) where.folderId = params.folderId;
    if (params.resourceType) where.resourceType = params.resourceType;
    if (params.tag) where.tags = { has: params.tag };
    if (params.q) {
      where.OR = [
        { alt: { contains: params.q, mode: 'insensitive' } },
        { caption: { contains: params.q, mode: 'insensitive' } },
        { publicId: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.media.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const item = await this.prisma.media.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Media not found');
    return item;
  }

  async update(id: string, data: { alt?: string; caption?: string; tags?: string[]; folderId?: string | null }) {
    await this.findOne(id);
    return this.prisma.media.update({ where: { id }, data });
  }

  async remove(id: string) {
    const m = await this.findOne(id);
    const rt = m.resourceType === 'VIDEO' ? 'video' : m.resourceType === 'RAW' ? 'raw' : 'image';
    try {
      await cloudinary.uploader.destroy(m.publicId, { resource_type: rt });
    } catch (err) {
      // soft failure — still delete the DB row
    }
    await this.prisma.media.delete({ where: { id } });
    return { id };
  }

  async bulk(action: 'delete' | 'move' | 'tag', ids: string[], extra?: { folderId?: string | null; tags?: string[] }) {
    if (action === 'delete') {
      for (const id of ids) await this.remove(id);
      return { count: ids.length };
    }
    if (action === 'move') {
      await this.prisma.media.updateMany({
        where: { id: { in: ids } },
        data: { folderId: extra?.folderId ?? null },
      });
      return { count: ids.length };
    }
    if (action === 'tag') {
      for (const id of ids) {
        const m = await this.findOne(id);
        const next = Array.from(new Set([...(m.tags || []), ...(extra?.tags || [])]));
        await this.prisma.media.update({ where: { id }, data: { tags: next } });
      }
      return { count: ids.length };
    }
    return { count: 0 };
  }

  // Folders
  async listFolders() {
    return this.prisma.mediaFolder.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createFolder(data: { name: string; parentId?: string | null }) {
    return this.prisma.mediaFolder.create({
      data: { name: data.name, parentId: data.parentId ?? null },
    });
  }

  async updateFolder(id: string, data: { name?: string; parentId?: string | null }) {
    return this.prisma.mediaFolder.update({ where: { id }, data });
  }

  async deleteFolder(id: string) {
    await this.prisma.media.updateMany({ where: { folderId: id }, data: { folderId: null } });
    await this.prisma.mediaFolder.delete({ where: { id } });
    return { id };
  }
}
