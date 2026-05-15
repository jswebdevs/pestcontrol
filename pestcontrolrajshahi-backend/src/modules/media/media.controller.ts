import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MediaType } from '@prisma/client';
import { MediaService } from './media.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'admin/media', version: '1' })
@UseGuards(JwtAdminGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('sign')
  sign(@Body() body: { folder?: string; resourceType?: 'image' | 'video' | 'raw' }) {
    return this.media.signUpload(body);
  }

  @Post('record')
  record(@Body() body: any, @CurrentUser() user: JwtUser) {
    return this.media.recordUpload({ ...body, uploadedBy: user.sub });
  }

  @Get()
  list(
    @Query('folderId') folderId?: string,
    @Query('resourceType') resourceType?: MediaType,
    @Query('tag') tag?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.media.list({
      folderId: folderId === 'null' ? null : folderId,
      resourceType,
      tag,
      q,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('folders')
  folders() {
    return this.media.listFolders();
  }

  @Post('folders')
  createFolder(@Body() body: { name: string; parentId?: string | null }) {
    return this.media.createFolder(body);
  }

  @Patch('folders/:id')
  updateFolder(@Param('id') id: string, @Body() body: { name?: string; parentId?: string | null }) {
    return this.media.updateFolder(id, body);
  }

  @Delete('folders/:id')
  deleteFolder(@Param('id') id: string) {
    return this.media.deleteFolder(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.media.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { alt?: string; caption?: string; tags?: string[]; folderId?: string | null },
  ) {
    return this.media.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.media.remove(id);
  }

  @Post('bulk')
  bulk(@Body() body: { action: 'delete' | 'move' | 'tag'; ids: string[]; folderId?: string | null; tags?: string[] }) {
    return this.media.bulk(body.action, body.ids, { folderId: body.folderId, tags: body.tags });
  }
}
