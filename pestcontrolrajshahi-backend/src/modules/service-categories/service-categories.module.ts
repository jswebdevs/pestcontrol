import { Module } from '@nestjs/common';
import { ServiceCategoriesService } from './service-categories.service';
import {
  AdminServiceCategoriesController,
  PublicServiceCategoriesController,
} from './service-categories.controller';

@Module({
  providers: [ServiceCategoriesService],
  controllers: [AdminServiceCategoriesController, PublicServiceCategoriesController],
  exports: [ServiceCategoriesService],
})
export class ServiceCategoriesModule {}
