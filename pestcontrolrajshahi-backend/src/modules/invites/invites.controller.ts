import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { InvitesService } from './invites.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

class CreateInviteDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsIn(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER']) role!: Role;
}

class AcceptInviteDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() phone?: string;
}

@Controller({ path: 'admin/invites', version: '1' })
@UseGuards(JwtAdminGuard)
export class AdminInvitesController {
  constructor(private readonly svc: InvitesService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Post()
  create(@CurrentUser() actor: JwtUser, @Body() body: CreateInviteDto) {
    return this.svc.create(actor, body);
  }

  @Post(':id/resend')
  resend(@CurrentUser() actor: JwtUser, @Param('id') id: string) {
    return this.svc.resend(actor, id);
  }

  @Delete(':id')
  revoke(@Param('id') id: string) {
    return this.svc.revoke(id);
  }
}

@Controller({ path: 'invites', version: '1' })
export class PublicInvitesController {
  constructor(private readonly svc: InvitesService) {}

  @Public()
  @Get(':token')
  validate(@Param('token') token: string) {
    return this.svc.validate(token);
  }

  @Public()
  @Post(':token/accept')
  accept(@Param('token') token: string, @Body() body: AcceptInviteDto) {
    return this.svc.accept(token, body);
  }
}
