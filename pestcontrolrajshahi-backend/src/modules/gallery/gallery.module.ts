import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { Public } from '../../common/decorators/public.decorator';

interface UpsertGalleryInput {
  image: string;
  caption?: string | null;
  category?: string | null;
  order?: number;
  isVisible?: boolean;
}

@Injectable()
class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic(category?: string) {
    return this.prisma.galleryItem.findMany({
      where: {
        isVisible: true,
        ...(category ? { category } : {}),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  listCategories() {
    return this.prisma.galleryItem.findMany({
      where: { isVisible: true, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
  }

  listAdmin() {
    return this.prisma.galleryItem.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getOne(id: string) {
    const item = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException();
    return item;
  }

  create(body: UpsertGalleryInput) {
    return this.prisma.galleryItem.create({
      data: {
        image: body.image,
        caption: body.caption ?? null,
        category: body.category ?? null,
        order: body.order ?? 0,
        isVisible: body.isVisible ?? true,
      },
    });
  }

  async update(id: string, body: Partial<UpsertGalleryInput>) {
    await this.getOne(id);
    return this.prisma.galleryItem.update({
      where: { id },
      data: {
        ...(body.image !== undefined ? { image: body.image } : {}),
        ...(body.caption !== undefined ? { caption: body.caption } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
        ...(body.isVisible !== undefined ? { isVisible: body.isVisible } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.getOne(id);
    return this.prisma.galleryItem.delete({ where: { id } });
  }

  async reorder(items: Array<{ id: string; order: number }>) {
    await this.prisma.$transaction(
      items.map((it) =>
        this.prisma.galleryItem.update({ where: { id: it.id }, data: { order: it.order } }),
      ),
    );
    return { ok: true };
  }
}

@Controller({ path: 'gallery', version: '1' })
class PublicGalleryController {
  constructor(private readonly svc: GalleryService) {}

  @Public()
  @Get()
  list(@Query('category') category?: string) {
    return this.svc.listPublic(category);
  }

  @Public()
  @Get('categories')
  categories() {
    return this.svc.listCategories();
  }
}

@Controller({ path: 'admin/gallery', version: '1' })
@UseGuards(JwtAdminGuard)
class AdminGalleryController {
  constructor(private readonly svc: GalleryService) {}

  @Get()
  list() {
    return this.svc.listAdmin();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getOne(id);
  }

  @Post()
  create(@Body() body: UpsertGalleryInput) {
    return this.svc.create(body);
  }

  @Patch('reorder')
  reorder(@Body() body: { items: Array<{ id: string; order: number }> }) {
    return this.svc.reorder(body.items);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<UpsertGalleryInput>) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}

@Module({
  providers: [GalleryService],
  controllers: [PublicGalleryController, AdminGalleryController],
})
export class GalleryModule {}
