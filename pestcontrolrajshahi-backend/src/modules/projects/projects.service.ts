import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import slugify from 'slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { RichContentService } from '../rich-content/rich-content.service';
import { SlugRedirectsService } from '../slug-redirects/slug-redirects.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rich: RichContentService,
    private readonly redirects: SlugRedirectsService,
  ) {}

  async listPublic(params: { category?: string }) {
    const where: Prisma.ProjectWhereInput = { status: 'PUBLISHED', deletedAt: null };
    if (params.category) where.category = params.category;
    const items = await this.prisma.project.findMany({
      where,
      orderBy: [{ order: 'asc' }, { date: 'desc' }],
    });
    return items.map((p) => ({ ...p, bodyHtml: this.rich.toHtml(p.body) }));
  }

  async findPublicBySlug(slug: string) {
    const p = await this.prisma.project.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
    });
    if (!p) throw new NotFoundException();
    return { ...p, bodyHtml: this.rich.toHtml(p.body) };
  }

  async adminList(params: { status?: ContentStatus; q?: string; trash?: boolean; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 30;
    const where: Prisma.ProjectWhereInput = {};
    where.deletedAt = params.trash ? { not: null } : null;
    if (params.status) where.status = params.status;
    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { slug: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async adminGet(id: string) {
    const p = await this.prisma.project.findUnique({ where: { id } });
    if (!p) throw new NotFoundException();
    return p;
  }

  async create(input: any) {
    if (input.body) this.rich.validateDoc(input.body);
    const slug = input.slug || slugify(input.title, { lower: true, strict: true });
    const taken = await this.prisma.project.findUnique({ where: { slug } });
    if (taken) throw new BadRequestException('Slug already used');
    return this.prisma.project.create({
      data: {
        title: input.title,
        slug,
        client: input.client,
        category: input.category,
        summary: input.summary || '',
        body: input.body ?? { type: 'doc', content: [] },
        cover: input.cover,
        gallery: input.gallery ?? [],
        date: input.date ? new Date(input.date) : null,
        status: input.status ?? 'DRAFT',
        publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
        order: input.order ?? 0,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoImage: input.seoImage,
      },
    });
  }

  async update(id: string, input: any) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    if (input.body) this.rich.validateDoc(input.body);
    const data: Prisma.ProjectUpdateInput = {};
    for (const f of [
      'title',
      'client',
      'category',
      'summary',
      'body',
      'cover',
      'gallery',
      'order',
      'seoTitle',
      'seoDescription',
      'seoImage',
    ]) {
      if (input[f] !== undefined) (data as any)[f] = input[f];
    }
    if (input.date !== undefined) data.date = input.date ? new Date(input.date) : null;
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === 'PUBLISHED' && !existing.publishedAt) data.publishedAt = new Date();
    }
    if (input.slug && input.slug !== existing.slug) {
      const taken = await this.prisma.project.findUnique({ where: { slug: input.slug } });
      if (taken) throw new BadRequestException('Slug already used');
      data.slug = input.slug;
      await this.redirects.record('project', existing.slug, input.slug, existing.id);
    }
    return this.prisma.project.update({ where: { id }, data });
  }

  publish(id: string) {
    return this.prisma.project.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
  }
  unpublish(id: string) {
    return this.prisma.project.update({ where: { id }, data: { status: 'DRAFT' } });
  }
  softDelete(id: string) {
    return this.prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  restore(id: string) {
    return this.prisma.project.update({ where: { id }, data: { deletedAt: null } });
  }
  permanentDelete(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
