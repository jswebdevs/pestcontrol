import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { FastifyReply, FastifyRequest } from 'fastify';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtCustomerGuard } from '../../common/guards/jwt-customer.guard';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { SessionScope } from '@prisma/client';

class RegisterDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() phone!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() username?: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() otpToken!: string;
}

class LoginDto {
  @IsString() @IsNotEmpty() identifier!: string;
  @IsString() @IsNotEmpty() password!: string;
}

class ForgotDto {
  @IsString() @IsNotEmpty() identifier!: string;
}

class ResetDto {
  @IsString() @IsNotEmpty() token!: string;
  @IsString() @MinLength(8) newPassword!: string;
}

function setAuthCookies(
  reply: FastifyReply,
  scope: SessionScope,
  cookiePrefix: string,
  tokens: { accessToken: string; refreshToken: string; accessMaxAge: number; refreshMaxAge: number },
  isProd: boolean,
  cookieDomain?: string,
) {
  const sc = scope === 'ADMIN' ? 'admin' : 'customer';
  const base: Record<string, any> = {
    path: '/',
    httpOnly: true,
    secure: isProd,
    // SameSite=none required for cross-subdomain XHR (frontend.X.com → backend.X.com).
    // Browsers refuse SameSite=none cookies without Secure, so this only kicks in in prod.
    sameSite: isProd ? ('none' as const) : ('lax' as const),
  };
  if (cookieDomain) base.domain = cookieDomain;
  reply.setCookie(`${cookiePrefix}_${sc}_access`, tokens.accessToken, {
    ...base,
    maxAge: tokens.accessMaxAge,
  });
  reply.setCookie(`${cookiePrefix}_${sc}_refresh`, tokens.refreshToken, {
    ...base,
    maxAge: tokens.refreshMaxAge,
  });
}

function clearAuthCookies(reply: FastifyReply, cookiePrefix: string, cookieDomain?: string) {
  const opts: Record<string, any> = { path: '/' };
  if (cookieDomain) opts.domain = cookieDomain;
  for (const sc of ['admin', 'customer']) {
    for (const k of ['access', 'refresh']) {
      reply.clearCookie(`${cookiePrefix}_${sc}_${k}`, opts);
    }
  }
}

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private isProd: boolean;
  private cookiePrefix: string;
  private cookieDomain?: string;

  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {
    this.isProd = config.get<string>('nodeEnv') === 'production';
    this.cookiePrefix = config.get<string>('cookiePrefix')!;
    this.cookieDomain = config.get<string>('cookie.domain') || undefined;
  }

  @Public()
  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.auth.register(body, {
      userAgent: String(req.headers['user-agent'] || ''),
      ip: req.ip,
    });
    setAuthCookies(reply, 'CUSTOMER', this.cookiePrefix, result.tokens, this.isProd, this.cookieDomain);
    return { user: result.user };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.auth.login(body, {
      userAgent: String(req.headers['user-agent'] || ''),
      ip: req.ip,
    });
    setAuthCookies(reply, 'CUSTOMER', this.cookiePrefix, result.tokens, this.isProd, this.cookieDomain);
    return { user: result.user };
  }

  @Public()
  @Post('admin/login')
  @HttpCode(200)
  async adminLogin(
    @Body() body: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.auth.adminLogin(body, {
      userAgent: String(req.headers['user-agent'] || ''),
      ip: req.ip,
    });
    setAuthCookies(reply, 'ADMIN', this.cookiePrefix, result.tokens, this.isProd, this.cookieDomain);
    return { user: result.user };
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  google() {
    return { ok: true };
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const profile = (req as any).user;
    const result = await this.auth.googleLoginOrSignup(profile, {
      userAgent: String(req.headers['user-agent'] || ''),
      ip: req.ip,
    });
    setAuthCookies(reply, 'CUSTOMER', this.cookiePrefix, result.tokens, this.isProd, this.cookieDomain);
    const url = `${this.config.get<string>('publicSiteUrl')}/account`;
    reply.redirect(url, 302);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const cookies = (req as any).cookies || {};
    const adminRefresh = cookies[`${this.cookiePrefix}_admin_refresh`];
    const customerRefresh = cookies[`${this.cookiePrefix}_customer_refresh`];
    const token = adminRefresh || customerRefresh;
    if (!token) throw new UnauthorizedException('No refresh token');
    const { tokens, scope } = await this.auth.refresh(token, {
      userAgent: String(req.headers['user-agent'] || ''),
      ip: req.ip,
    });
    setAuthCookies(reply, scope, this.cookiePrefix, tokens, this.isProd, this.cookieDomain);
    return { ok: true };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const cookies = (req as any).cookies || {};
    await this.auth.logout(cookies[`${this.cookiePrefix}_admin_refresh`]);
    await this.auth.logout(cookies[`${this.cookiePrefix}_customer_refresh`]);
    clearAuthCookies(reply, this.cookiePrefix, this.cookieDomain);
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: FastifyRequest) {
    // Try customer first, then admin (just by reading cookies; the actual auth happens in /users/me etc)
    const customer = (req as any).user;
    if (customer?.sub) return this.auth.me(customer.sub);
    throw new UnauthorizedException();
  }

  @Get('me/customer')
  @UseGuards(JwtCustomerGuard)
  meCustomer(@CurrentUser() user: JwtUser) {
    return this.auth.me(user.sub);
  }

  @Get('me/admin')
  @UseGuards(JwtAdminGuard)
  meAdmin(@CurrentUser() user: JwtUser) {
    return this.auth.me(user.sub);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  forgot(@Body() body: ForgotDto) {
    return this.auth.forgotPassword(body.identifier);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  reset(@Body() body: ResetDto) {
    return this.auth.resetPassword(body.token, body.newPassword);
  }
}
