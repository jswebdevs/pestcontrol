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
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UsersService } from './users.service';
import { JwtCustomerGuard } from '../../common/guards/jwt-customer.guard';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

class UpdateMeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() avatar?: string;
}

class SetEmailDto {
  @IsEmail() email!: string;
}

class SetUsernameDto {
  @IsString()
  @Matches(/^[a-z0-9_]{3,30}$/, { message: 'username must be 3–30 chars, lowercase/digits/underscore' })
  username!: string;
}

class ChangePhoneDto {
  @IsString() @IsNotEmpty() newPhone!: string;
  @IsString() @IsNotEmpty() otpToken!: string;
}

class ChangePasswordDto {
  @IsOptional() @IsString() currentPassword?: string;
  @IsString() @MinLength(8) newPassword!: string;
}

@Controller({ path: 'users/me', version: '1' })
@UseGuards(JwtCustomerGuard)
export class UsersMeController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@CurrentUser() u: JwtUser) {
    return this.users.getMe(u.sub);
  }

  @Patch()
  update(@CurrentUser() u: JwtUser, @Body() body: UpdateMeDto) {
    return this.users.updateMe(u.sub, body);
  }

  @Post('email')
  setEmail(@CurrentUser() u: JwtUser, @Body() body: SetEmailDto) {
    return this.users.setEmail(u.sub, body.email);
  }

  @Post('username')
  setUsername(@CurrentUser() u: JwtUser, @Body() body: SetUsernameDto) {
    return this.users.setUsername(u.sub, body.username);
  }

  @Post('phone')
  changePhone(@CurrentUser() u: JwtUser, @Body() body: ChangePhoneDto) {
    return this.users.changePhone(u.sub, body.newPhone, body.otpToken);
  }

  @Patch('password')
  changePassword(@CurrentUser() u: JwtUser, @Body() body: ChangePasswordDto) {
    return this.users.changePassword(u.sub, body.currentPassword, body.newPassword);
  }

  @Get('sessions')
  sessions(@CurrentUser() u: JwtUser) {
    return this.users.listSessions(u.sub);
  }

  @Delete('sessions/:id')
  revokeSession(@CurrentUser() u: JwtUser, @Param('id') id: string) {
    return this.users.revokeSession(u.sub, id);
  }

  @Delete()
  delete(@CurrentUser() u: JwtUser) {
    return this.users.softDeleteMe(u.sub);
  }
}

@Controller({ path: 'users/me/email/verify', version: '1' })
export class UsersEmailVerifyController {
  constructor(private readonly users: UsersService) {}

  @Public()
  @Get()
  verify(@Query('token') token: string) {
    return this.users.verifyEmail(token);
  }
}

// ─── Admin user management ────────────────────────────

class AdminListQuery {
  @IsOptional() @IsIn(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER']) role?: Role;
  @IsOptional() @IsIn(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']) status?: any;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() limit?: number;
  @IsOptional() hasGoogle?: string;
}

class AdminUpdateUserDto {
  @IsOptional() @IsIn(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER']) role?: Role;
  @IsOptional() @IsIn(['ACTIVE', 'SUSPENDED']) status?: any;
  @IsOptional() @IsString() name?: string;
}

@Controller({ path: 'admin/users', version: '1' })
@UseGuards(JwtAdminGuard)
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() q: AdminListQuery) {
    return this.users.adminList({
      role: q.role,
      status: q.status,
      q: q.q,
      page: q.page,
      limit: q.limit,
      hasGoogle: q.hasGoogle === 'true' ? true : undefined,
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.adminGet(id);
  }

  @Patch(':id')
  update(@CurrentUser() actor: JwtUser, @Param('id') id: string, @Body() body: AdminUpdateUserDto) {
    return this.users.adminUpdate(actor, id, body);
  }

  @Post(':id/force-logout')
  forceLogout(@Param('id') id: string) {
    return this.users.adminForceLogout(id);
  }

  @Post(':id/password-reset')
  passwordReset(@Param('id') id: string) {
    return this.users.adminSendPasswordReset(id);
  }

  @Delete(':id')
  remove(@CurrentUser() actor: JwtUser, @Param('id') id: string) {
    return this.users.adminSoftDelete(actor, id);
  }
}
