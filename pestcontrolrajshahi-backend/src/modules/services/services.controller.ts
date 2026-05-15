import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { ServicesService } from './services.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller({ path: 'services', version: '1' })
export class PublicServicesController {
  constructor(private readonly svc: ServicesService) {}

  @Public()
  @Get()
  list(
    @Query('category') categorySlug?: string,
    @Query('q') q?: string,
    @Query('featured') featured?: string,
  ) {
    return this.svc.listPublic({ categorySlug, q, featured: featured === 'true' });
  }

  @Public()
  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.svc.findPublicBySlug(slug);
  }
}

@Controller({ path: 'admin/services', version: '1' })
@UseGuards(JwtAdminGuard)
export class AdminServicesController {
  constructor(private readonly svc: ServicesService) {}

  @Get()
  list(
    @Query('status') status?: ContentStatus,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('trash') trash?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.adminList({
      status,
      q,
      categoryId,
      trash: trash === 'true',
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.adminGet(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.svc.publish(id);
  }

  @Post(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.svc.unpublish(id);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.svc.softDelete(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.svc.restore(id);
  }

  @Delete(':id/permanent')
  permanent(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Only super admin can permanently delete');
    }
    return this.svc.permanentDelete(id);
  }
}
