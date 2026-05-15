import { Module } from '@nestjs/common';
import { PreviewService } from './preview.service';
import { AdminPreviewController, PublicPreviewController } from './preview.controller';
import { RichContentService } from '../rich-content/rich-content.service';

@Module({
  providers: [PreviewService, RichContentService],
  controllers: [AdminPreviewController, PublicPreviewController],
})
export class PreviewModule {}
