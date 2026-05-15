import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import slugify from 'slugify';

@Injectable()
export class ServiceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic() {
    return this.prisma.serviceCategory.findMany({
      where: { isVisible: true },
      orderBy: { order: 'asc' },
    });
  }

  async listAdmin() {
    return this.prisma.serviceCategory.findMany({ orderBy: { order: 'asc' } });
  }

  async create(data: { name: string; slug?: string; icon?: string; order?: number; isVisible?: boolean }) {
    const slug = data.slug || slugify(data.name, { lower: true, strict: true });
    return this.prisma.serviceCategory.create({
      data: {
        name: data.name,
        slug,
        icon: data.icon,
        order: data.order ?? 0,
        isVisible: data.isVisible ?? true,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; slug?: string; icon?: string; order?: number; isVisible?: boolean },
  ) {
    const exists = await this.prisma.serviceCategory.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException();
    return this.prisma.serviceCategory.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.serviceCategory.delete({ where: { id } });
    return { id };
  }

  async reorder(items: Array<{ id: string; order: number }>) {
    await this.prisma.$transaction(
      items.map((it) =>
        this.prisma.serviceCategory.update({ where: { id: it.id }, data: { order: it.order } }),
      ),
    );
    return { ok: true };
  }
}
