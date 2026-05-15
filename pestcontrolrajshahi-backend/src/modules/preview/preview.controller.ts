import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PreviewService } from './preview.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller({ path: 'admin/preview', version: '1' })
@UseGuards(JwtAdminGuard)
export class AdminPreviewController {
  constructor(private readonly svc: PreviewService) {}

  @Post('mint')
  mint(
    @CurrentUser() u: JwtUser,
    @Body() body: { resourceType: 'service' | 'project'; resourceId: string },
  ) {
    return this.svc.mint(u.sub, body.resourceType, body.resourceId);
  }
}

@Controller({ path: 'preview', version: '1' })
export class PublicPreviewController {
  constructor(private readonly svc: PreviewService) {}

  @Public()
  @Get(':token')
  resolve(@Param('token') token: string) {
    return this.svc.resolve(token);
  }
}
