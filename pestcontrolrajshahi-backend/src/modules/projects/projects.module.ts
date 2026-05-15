import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AdminProjectsController, PublicProjectsController } from './projects.controller';
import { RichContentService } from '../rich-content/rich-content.service';

@Module({
  providers: [ProjectsService, RichContentService],
  controllers: [AdminProjectsController, PublicProjectsController],
})
export class ProjectsModule {}
