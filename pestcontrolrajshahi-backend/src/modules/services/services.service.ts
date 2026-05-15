import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import slugify from 'slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { RichContentService } from '../rich-content/rich-content.service';
import { SlugRedirectsService } from '../slug-redirects/slug-redirects.service';

interface UpsertServiceInput {
  name: string;
  slug?: string;
  categoryId: string;
  shortDesc: string;
  longDesc?: any;
  image?: string;
  gallery?: string[];
  basePrice?: number | string;
  priceUnit?: string;
  featured?: boolean;
  status?: ContentStatus;
  order?: number;
  faqs?: any;
  inclusions?: string[];
  exclusions?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
}

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rich: RichContentService,
    private readonly redirects: SlugRedirectsService,
  ) {}

  // ─── Public ───────────────────────────────────────
  async listPublic(params: { categorySlug?: string; q?: string; featured?: boolean }) {
    const where: Prisma.ServiceWhereInput = {
      status: 'PUBLISHED',
      deletedAt: null,
    };
    if (params.categorySlug) {
      where.category = { slug: params.categorySlug };
    }
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { shortDesc: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    if (params.featured) where.featured = true;
    const items = await this.prisma.service.findMany({
      where,
      include: { category: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return items.map((s) => this.publicShape(s));
  }

  async findPublicBySlug(slug: string) {
    const s = await this.prisma.service.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      include: { category: true },
    });
    if (!s) throw new NotFoundException();
    return this.publicShape(s);
  }

  publicShape(s: any) {
    return {
      ...s,
      longDescHtml: this.rich.toHtml(s.longDesc),
    };
  }

  // ─── Admin ────────────────────────────────────────
  async adminList(params: { status?: ContentStatus; q?: string; categoryId?: string; trash?: boolean; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 30;
    const where: Prisma.ServiceWhereInput = {};
    if (params.trash) where.deletedAt = { not: null };
    else where.deletedAt = null;
    if (params.status) where.status = params.status;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { slug: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        include: { category: true },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.service.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async adminGet(id: string) {
    const s = await this.prisma.service.findUnique({ where: { id }, include: { category: true } });
    if (!s) throw new NotFoundException();
    return s;
  }

  async create(input: UpsertServiceInput) {
    if (input.longDesc) this.rich.validateDoc(input.longDesc);
    const slug = input.slug || slugify(input.name, { lower: true, strict: true });
    const taken = await this.prisma.service.findUnique({ where: { slug } });
    if (taken) throw new BadRequestException('Slug already used');
    return this.prisma.service.create({
      data: {
        name: input.name,
        slug,
        categoryId: input.categoryId,
        shortDesc: input.shortDesc,
        longDesc: input.longDesc ?? { type: 'doc', content: [] },
        image: input.image,
        gallery: input.gallery ?? [],
        basePrice: input.basePrice ? new Prisma.Decimal(input.basePrice as any) : null,
        priceUnit: input.priceUnit,
        featured: input.featured ?? false,
        status: input.status ?? 'DRAFT',
        publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
        order: input.order ?? 0,
        faqs: input.faqs ?? null,
        inclusions: input.inclusions ?? [],
        exclusions: input.exclusions ?? [],
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoImage: input.seoImage,
      },
    });
  }

  async update(id: string, input: Partial<UpsertServiceInput>) {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    if (input.longDesc) this.rich.validateDoc(input.longDesc);
    const data: Prisma.ServiceUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.shortDesc !== undefined) data.shortDesc = input.shortDesc;
    if (input.longDesc !== undefined) data.longDesc = input.longDesc;
    if (input.image !== undefined) data.image = input.image;
    if (input.gallery !== undefined) data.gallery = input.gallery;
    if (input.basePrice !== undefined) data.basePrice = input.basePrice ? new Prisma.Decimal(input.basePrice as any) : null;
    if (input.priceUnit !== undefined) data.priceUnit = input.priceUnit;
    if (input.featured !== undefined) data.featured = input.featured;
    if (input.order !== undefined) data.order = input.order;
    if (input.faqs !== undefined) data.faqs = input.faqs ?? Prisma.DbNull;
    if (input.inclusions !== undefined) data.inclusions = input.inclusions;
    if (input.exclusions !== undefined) data.exclusions = input.exclusions;
    if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle;
    if (input.seoDescription !== undefined) data.seoDescription = input.seoDescription;
    if (input.seoImage !== undefined) data.seoImage = input.seoImage;
    if (input.categoryId !== undefined) {
      data.category = { connect: { id: input.categoryId } };
    }
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === 'PUBLISHED' && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    if (input.slug && input.slug !== existing.slug) {
      const taken = await this.prisma.service.findUnique({ where: { slug: input.slug } });
      if (taken) throw new BadRequestException('Slug already used');
      data.slug = input.slug;
      // record redirect
      await this.redirects.record('service', existing.slug, input.slug, existing.id);
    }
    return this.prisma.service.update({ where: { id }, data });
  }

  async publish(id: string) {
    return this.prisma.service.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  async unpublish(id: string) {
    return this.prisma.service.update({
      where: { id },
      data: { status: 'DRAFT' },
    });
  }

  async softDelete(id: string) {
    return this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return this.prisma.service.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async permanentDelete(id: string) {
    return this.prisma.service.delete({ where: { id } });
  }
}
