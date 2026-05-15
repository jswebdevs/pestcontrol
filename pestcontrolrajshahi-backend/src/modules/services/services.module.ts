import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { AdminServicesController, PublicServicesController } from './services.controller';
import { RichContentService } from '../rich-content/rich-content.service';

@Module({
  providers: [ServicesService, RichContentService],
  controllers: [AdminServicesController, PublicServicesController],
  exports: [ServicesService, RichContentService],
})
export class ServicesModule {}
