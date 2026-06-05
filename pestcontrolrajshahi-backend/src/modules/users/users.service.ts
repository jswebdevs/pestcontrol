import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly otp: OtpService,
    private readonly mail: MailService,
  ) {}

  private sanitize<T extends { passwordHash?: any }>(u: T) {
    if (!u) return u;
    const { passwordHash, ...rest } = u as any;
    return rest;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { oauthAccounts: { select: { provider: true, email: true } } },
    });
    if (!user) throw new NotFoundException();
    return this.sanitize(user);
  }

  async updateMe(userId: string, data: { name?: string; avatar?: string }) {
    const u = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.sanitize(u);
  }

  /** Set email — only allowed if email is currently NULL. Sends verification link. */
  async setEmail(userId: string, email: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException();
    if (u.email) throw new BadRequestException('Email is already set and cannot be changed');
    const taken = await this.prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
    if (taken) throw new ConflictException('Email already in use');
    const token = this.jwt.sign(
      { sub: userId, email, kind: 'verify-email' },
      { secret: this.config.get<string>('jwt.accessSecret')!, expiresIn: '1h' },
    );
    const link = `${this.config.get<string>('publicSiteUrl')}/account/verify-email?token=${token}`;
    await this.mail.send('email-verification', email, { link });
    return { sent: true };
  }

  async verifyEmail(token: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: this.config.get<string>('jwt.accessSecret')! });
    } catch {
      throw new BadRequestException('Invalid or expired verification token');
    }
    if (payload.kind !== 'verify-email') {
      throw new BadRequestException('Wrong token kind');
    }
    const taken = await this.prisma.user.findFirst({
      where: { email: payload.email, NOT: { id: payload.sub } },
    });
    if (taken) throw new ConflictException('Email already in use');
    const u = await this.prisma.user.update({
      where: { id: payload.sub },
      data: { email: payload.email, emailVerified: true },
    });
    return this.sanitize(u);
  }

  async setUsername(userId: string, username: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException();
    if (u.username) throw new BadRequestException('Username is already set and cannot be changed');
    const taken = await this.prisma.user.findFirst({ where: { username } });
    if (taken) throw new ConflictException('Username already taken');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { username },
    });
    return this.sanitize(updated);
  }

  async changePhone(userId: string, newPhone: string, otpToken: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException();
    if (u.phoneChangedAt) {
      const cutoff = new Date(u.phoneChangedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (cutoff > new Date()) {
        return { allowedAt: cutoff.toISOString(), error: 'Phone change throttled' };
      }
    }
    const { phone } = this.otp.consume(otpToken, 'phone-change');
    if (phone !== newPhone) throw new BadRequestException('OTP phone mismatch');
    const taken = await this.prisma.user.findFirst({ where: { phone: newPhone, NOT: { id: userId } } });
    if (taken) throw new ConflictException('Phone already in use');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { phone: newPhone, phoneChangedAt: new Date(), phoneVerified: true },
    });
    // Revoke all OTHER customer sessions
    await this.prisma.session.updateMany({
      where: { userId, scope: 'CUSTOMER', revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return this.sanitize(updated);
  }

  async changePassword(userId: string, currentPassword: string | undefined, newPassword: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException();
    if (u.passwordHash) {
      if (!currentPassword) throw new BadRequestException('Current password required');
      const ok = await bcrypt.compare(currentPassword, u.passwordHash);
      if (!ok) throw new BadRequestException('Current password incorrect');
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return { ok: true };
  }

  async listSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const s = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!s || s.userId !== userId) throw new NotFoundException();
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
    return { ok: true };
  }

  async softDeleteMe(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  // ─── Admin user management ─────────────────────────────────

  async adminList(params: {
    role?: Role;
    status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
    q?: string;
    page?: number;
    limit?: number;
    hasGoogle?: boolean;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (params.role) where.role = params.role;
    if (params.status) where.status = params.status;
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { email: { contains: params.q, mode: 'insensitive' } },
        { phone: { contains: params.q } },
        { username: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    if (params.hasGoogle === true) {
      where.oauthAccounts = { some: { provider: 'google' } };
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { oauthAccounts: { select: { provider: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items: items.map((u) => this.sanitize(u)), total, page, limit };
  }

  async adminGet(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        oauthAccounts: { select: { provider: true, email: true } },
        orders: { take: 50, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!user) throw new NotFoundException();
    return this.sanitize(user);
  }

  async adminUpdate(
    actor: { sub: string; role: string },
    id: string,
    data: { role?: Role; status?: 'ACTIVE' | 'SUSPENDED'; name?: string },
  ) {
    if (data.role && actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only super admin can change role');
    }
    const updated = await this.prisma.user.update({ where: { id }, data });
    return this.sanitize(updated);
  }

  async adminForceLogout(id: string) {
    await this.prisma.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async adminSendPasswordReset(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException();
    if (user.email) {
      const token = this.jwt.sign(
        { sub: user.id, kind: 'reset' },
        { secret: this.config.get<string>('jwt.accessSecret')!, expiresIn: '1h' },
      );
      const link = `${this.config.get<string>('publicSiteUrl')}/admin/reset-password?token=${token}`;
      await this.mail.send('password-reset-link', user.email, { link });
      return { ok: true, via: 'email' };
    }
    if (user.phone) {
      await this.otp.send(user.phone, 'reset');
      return { ok: true, via: 'sms' };
    }
    throw new BadRequestException('No contact channel');
  }

  async adminSoftDelete(actor: { role: string }, id: string) {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only super admin can delete users');
    }
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.prisma.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }
}
