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
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { Public } from '../../common/decorators/public.decorator';

@Injectable()
class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic() {
    return this.prisma.testimonial.findMany({
      where: { isVisible: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  listAdmin() {
    return this.prisma.testimonial.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
  }

  create(body: any) {
    return this.prisma.testimonial.create({ data: body });
  }

  async update(id: string, body: any) {
    const exists = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException();
    return this.prisma.testimonial.update({ where: { id }, data: body });
  }

  remove(id: string) {
    return this.prisma.testimonial.delete({ where: { id } });
  }

  async reorder(items: Array<{ id: string; order: number }>) {
    await this.prisma.$transaction(
      items.map((it) => this.prisma.testimonial.update({ where: { id: it.id }, data: { order: it.order } })),
    );
    return { ok: true };
  }
}

@Controller({ path: 'testimonials', version: '1' })
class PublicTestimonialsController {
  constructor(private readonly svc: TestimonialsService) {}
  @Public()
  @Get()
  list() {
    return this.svc.listPublic();
  }
}

@Controller({ path: 'admin/testimonials', version: '1' })
@UseGuards(JwtAdminGuard)
class AdminTestimonialsController {
  constructor(private readonly svc: TestimonialsService) {}

  @Get()
  list() {
    return this.svc.listAdmin();
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
  providers: [TestimonialsService],
  controllers: [AdminTestimonialsController, PublicTestimonialsController],
})
export class TestimonialsModule {}
