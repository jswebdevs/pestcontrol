import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ServiceCategoriesService } from './service-categories.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { Public } from '../../common/decorators/public.decorator';

class UpsertCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsInt() order?: number;
  @IsOptional() @IsBoolean() isVisible?: boolean;
}

@Controller({ path: 'service-categories', version: '1' })
export class PublicServiceCategoriesController {
  constructor(private readonly svc: ServiceCategoriesService) {}

  @Public()
  @Get()
  list() {
    return this.svc.listPublic();
  }
}

@Controller({ path: 'admin/service-categories', version: '1' })
@UseGuards(JwtAdminGuard)
export class AdminServiceCategoriesController {
  constructor(private readonly svc: ServiceCategoriesService) {}

  @Get()
  list() {
    return this.svc.listAdmin();
  }

  @Post()
  create(@Body() body: UpsertCategoryDto & { name: string }) {
    return this.svc.create(body);
  }

  @Patch('reorder')
  reorder(@Body() body: { items: Array<{ id: string; order: number }> }) {
    return this.svc.reorder(body.items);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpsertCategoryDto) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
