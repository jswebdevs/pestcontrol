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
import { RichContentService } from '../rich-content/rich-content.service';

@Injectable()
class FaqsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rich: RichContentService,
  ) {}

  async listPublic(category?: string) {
    const items = await this.prisma.faq.findMany({
      where: { isVisible: true, ...(category ? { category } : {}) },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });
    return items.map((f) => ({ ...f, answerHtml: this.rich.toHtml(f.answer) }));
  }

  listAdmin(category?: string) {
    return this.prisma.faq.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });
  }

  create(body: any) {
    if (body.answer) this.rich.validateDoc(body.answer);
    return this.prisma.faq.create({ data: body });
  }

  async update(id: string, body: any) {
    const exists = await this.prisma.faq.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException();
    if (body.answer) this.rich.validateDoc(body.answer);
    return this.prisma.faq.update({ where: { id }, data: body });
  }

  remove(id: string) {
    return this.prisma.faq.delete({ where: { id } });
  }

  async reorder(items: Array<{ id: string; order: number }>) {
    await this.prisma.$transaction(
      items.map((it) => this.prisma.faq.update({ where: { id: it.id }, data: { order: it.order } })),
    );
    return { ok: true };
  }
}

@Controller({ path: 'faqs', version: '1' })
class PublicFaqsController {
  constructor(private readonly svc: FaqsService) {}
  @Public()
  @Get()
  list(@Query('category') category?: string) {
    return this.svc.listPublic(category);
  }
}

@Controller({ path: 'admin/faqs', version: '1' })
@UseGuards(JwtAdminGuard)
class AdminFaqsController {
  constructor(private readonly svc: FaqsService) {}

  @Get()
  list(@Query('category') category?: string) {
    return this.svc.listAdmin(category);
  }

  @Post()
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Patch('reorder')
  reorder(@Body() body: { items: Array<{ id: string; order: number }> }) {
    return this.svc.reorder(body.items);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}

@Module({
  providers: [FaqsService, RichContentService],
  controllers: [AdminFaqsController, PublicFaqsController],
})
export class FaqsModule {}
