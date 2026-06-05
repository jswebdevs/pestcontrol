import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, SessionScope, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { MailService } from '../mail/mail.service';

export interface RegisterDto {
  name: string;
  phone: string;
  email?: string;
  username?: string;
  password: string;
  otpToken: string;
}

export interface LoginDto {
  identifier: string;
  password: string;
}

export interface IssueTokensInput {
  userId: string;
  role: Role;
  scope: SessionScope;
  email?: string | null;
  phone?: string | null;
  name?: string;
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly otp: OtpService,
    private readonly mail: MailService,
  ) {}

  // ─── Hashing helpers ─────────────────────────────────────
  private async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }
  private hashRefresh(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  // ─── User resolution ────────────────────────────────────
  private async resolveByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: identifier }, { phone: identifier }, { username: identifier }],
      },
    });
  }

  // ─── Token issuing ─────────────────────────────────────
  async issueTokens(input: IssueTokensInput) {
    const isAdmin = input.scope === 'ADMIN';
    const accessPayload = {
      sub: input.userId,
      role: input.role,
      scope: input.scope,
      email: input.email,
      phone: input.phone,
      name: input.name,
    };
    const accessTtl = isAdmin ? '15m' : '30m';
    const refreshTtlMs = (isAdmin ? 7 : 30) * 24 * 60 * 60 * 1000;
    const accessToken = this.jwt.sign(accessPayload, {
      secret: this.config.get<string>('jwt.accessSecret')!,
      expiresIn: accessTtl,
    });
    const refreshRaw = randomBytes(48).toString('hex');
    const refreshHash = this.hashRefresh(refreshRaw);

    await this.prisma.session.create({
      data: {
        userId: input.userId,
        refreshHash,
        userAgent: input.userAgent || null,
        ip: input.ip || null,
        scope: input.scope,
        expiresAt: new Date(Date.now() + refreshTtlMs),
      },
    });

    const refreshToken = this.jwt.sign(
      { sub: input.userId, scope: input.scope, jti: refreshHash },
      {
        secret: this.config.get<string>('jwt.refreshSecret')!,
        expiresIn: isAdmin ? '7d' : '30d',
      },
    );

    return {
      accessToken,
      refreshToken,
      accessMaxAge: isAdmin ? 15 * 60 : 30 * 60,
      refreshMaxAge: refreshTtlMs / 1000,
    };
  }

  // ─── Cookie names ─────────────────────────────────────
  cookieNames(scope: SessionScope) {
    const prefix = this.config.get<string>('cookiePrefix') || 'app';
    const sc = scope === 'ADMIN' ? 'admin' : 'customer';
    return {
      access: `${prefix}_${sc}_access`,
      refresh: `${prefix}_${sc}_refresh`,
    };
  }

  // ─── Public register (customer only) ────────────────────
  async register(dto: RegisterDto, ctx: { userAgent?: string; ip?: string }) {
    const { phone } = this.otp.consume(dto.otpToken, 'register');
    if (phone !== dto.phone) {
      throw new BadRequestException('OTP phone mismatch');
    }
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: dto.phone },
          dto.email ? { email: dto.email } : { id: '__nope__' },
          dto.username ? { username: dto.username } : { id: '__nope__' },
        ],
      },
    });
    if (existing) {
      throw new ConflictException('Phone, email or username already in use');
    }
    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email || null,
        username: dto.username || null,
        passwordHash,
        phoneVerified: true,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    const tokens = await this.issueTokens({
      userId: user.id,
      role: user.role,
      scope: 'CUSTOMER',
      email: user.email,
      phone: user.phone,
      name: user.name,
      userAgent: ctx.userAgent,
      ip: ctx.ip,
    });
    return { user: this.sanitize(user), tokens };
  }

  // ─── Login (customer scope) ────────────────────────────
  async login(dto: LoginDto, ctx: { userAgent?: string; ip?: string }) {
    const user = await this.resolveByIdentifier(dto.identifier);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account suspended');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.issueTokens({
      userId: user.id,
      role: user.role,
      scope: 'CUSTOMER',
      email: user.email,
      phone: user.phone,
      name: user.name,
      userAgent: ctx.userAgent,
      ip: ctx.ip,
    });
    return { user: this.sanitize(user), tokens };
  }

  // ─── Admin login ────────────────────────────────────
  async adminLogin(dto: LoginDto, ctx: { userAgent?: string; ip?: string }) {
    const user = await this.resolveByIdentifier(dto.identifier);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account not active');
    }
    if (!['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user.role)) {
      throw new UnauthorizedException('Not an admin account');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.issueTokens({
      userId: user.id,
      role: user.role,
      scope: 'ADMIN',
      email: user.email,
      phone: user.phone,
      name: user.name,
      userAgent: ctx.userAgent,
      ip: ctx.ip,
    });
    return { user: this.sanitize(user), tokens };
  }

  // ─── Google OAuth callback resolution ───────────────────
  async googleLoginOrSignup(
    profile: { providerUserId: string; email?: string; name?: string; avatar?: string },
    ctx: { userAgent?: string; ip?: string },
  ) {
    // 1. Look up by OAuth account
    const oauth = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerUserId: { provider: 'google', providerUserId: profile.providerUserId } },
      include: { user: true },
    });
    let user = oauth?.user;

    // 2. Look up by email
    if (!user && profile.email) {
      user = (await this.prisma.user.findFirst({
        where: { email: profile.email, deletedAt: null },
      })) || undefined;
      if (user) {
        await this.prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerUserId: profile.providerUserId,
            email: profile.email,
          },
        });
        if (!user.emailVerified) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true },
          });
        }
      }
    }

    // 3. Create new user
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email || null,
          name: profile.name || 'Google User',
          avatar: profile.avatar || null,
          emailVerified: !!profile.email,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          oauthAccounts: {
            create: {
              provider: 'google',
              providerUserId: profile.providerUserId,
              email: profile.email || null,
            },
          },
        },
      });
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.issueTokens({
      userId: user.id,
      role: user.role,
      scope: 'CUSTOMER',
      email: user.email,
      phone: user.phone,
      name: user.name,
      userAgent: ctx.userAgent,
      ip: ctx.ip,
    });
    return { user: this.sanitize(user), tokens };
  }

  // ─── Refresh ────────────────────────────────────────
  async refresh(refreshToken: string, ctx: { userAgent?: string; ip?: string }) {
    let decoded: any;
    try {
      decoded = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret')!,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const session = await this.prisma.session.findFirst({
      where: { refreshHash: decoded.jti, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    if (!session) throw new UnauthorizedException('Session not found');
    if (session.user.deletedAt || session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account not active');
    }
    // Rotate refresh: revoke old, issue new
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    const tokens = await this.issueTokens({
      userId: session.userId,
      role: session.user.role,
      scope: session.scope,
      email: session.user.email,
      phone: session.user.phone,
      name: session.user.name,
      userAgent: ctx.userAgent,
      ip: ctx.ip,
    });
    return { tokens, scope: session.scope as SessionScope };
  }

  // ─── Logout ─────────────────────────────────────────
  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return { ok: true };
    try {
      const decoded: any = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret')!,
      });
      await this.prisma.session.updateMany({
        where: { refreshHash: decoded.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      /* ignore */
    }
    return { ok: true };
  }

  // ─── /me ────────────────────────────────────────────
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { oauthAccounts: { select: { provider: true } } },
    });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  // ─── Forgot password ─────────────────────────────────
  async forgotPassword(identifier: string) {
    const user = await this.resolveByIdentifier(identifier);
    if (!user) return { ok: true };
    if (user.email) {
      const token = this.jwt.sign(
        { sub: user.id, kind: 'reset' },
        { secret: this.config.get<string>('jwt.accessSecret')!, expiresIn: '1h' },
      );
      const link = `${this.config.get<string>('publicSiteUrl')}/admin/reset-password?token=${token}`;
      await this.mail.send('password-reset-link', user.email, { link });
    } else if (user.phone) {
      await this.otp.send(user.phone, 'reset');
    }
    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(token, {
        secret: this.config.get<string>('jwt.accessSecret')!,
      });
    } catch {
      // Could also be an OTP token
      try {
        payload = this.jwt.verify(token, {
          secret: this.config.get<string>('jwt.otpSecret')!,
        });
      } catch {
        throw new BadRequestException('Invalid or expired reset token');
      }
    }
    if (payload.kind && payload.kind !== 'reset' && payload.purpose !== 'reset') {
      throw new BadRequestException('Wrong token kind');
    }
    let userId = payload.sub;
    if (!userId && payload.phone) {
      const u = await this.prisma.user.findUnique({ where: { phone: payload.phone } });
      userId = u?.id;
    }
    if (!userId) throw new BadRequestException('User not found');
    const hash = await this.hashPassword(newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  // ─── Sanitize ─────────────────────────────────────
  sanitize(u: any) {
    if (!u) return u;
    const { passwordHash, ...rest } = u;
    return rest;
  }
}
