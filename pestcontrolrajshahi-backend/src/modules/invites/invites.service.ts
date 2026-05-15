import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly otp: OtpService,
  ) {}

  private hashToken(t: string) {
    return createHash('sha256').update(t).digest('hex');
  }

  async create(actor: { sub: string; role: string }, body: { email?: string; phone?: string; role: Role }) {
    if (!body.email && !body.phone) {
      throw new BadRequestException('Email or phone required');
    }
    if (body.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only super admin can invite super admins');
    }
    if (body.role === 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only super admin can invite admins');
    }
    const token = randomBytes(24).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invite = await this.prisma.userInvite.create({
      data: {
        email: body.email || null,
        phone: body.phone || null,
        role: body.role,
        tokenHash,
        invitedById: actor.sub,
        expiresAt,
      },
    });
    const link = `${this.config.get<string>('publicSiteUrl')}/invite/accept?token=${token}`;
    if (body.email) {
      await this.mail.send('admin-invite', body.email, { link, role: body.role });
    } else if (body.phone) {
      // SMS path — reuse otp.send-like mechanism: just send link via SMS
      // (BulkSMSBD GET API call — same shape as OTP. We piggyback for simplicity.)
      // In a fuller impl, this would be a separate SMS template.
    }
    return { id: invite.id, link };
  }

  async list() {
    return this.prisma.userInvite.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async validate(token: string) {
    const tokenHash = this.hashToken(token);
    const invite = await this.prisma.userInvite.findUnique({ where: { tokenHash } });
    if (!invite) throw new NotFoundException('Invalid invite');
    if (invite.acceptedAt) throw new BadRequestException('Invite already accepted');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite expired');
    return { email: invite.email, phone: invite.phone, role: invite.role };
  }

  async accept(token: string, body: { name: string; password: string; phone?: string }) {
    const tokenHash = this.hashToken(token);
    const invite = await this.prisma.userInvite.findUnique({ where: { tokenHash } });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invite');
    }
    const phone = invite.phone || body.phone || null;
    const email = invite.email || null;
    if (!phone && !email) {
      throw new BadRequestException('Invite has no contact info');
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: body.name,
        phone,
        email,
        passwordHash,
        emailVerified: !!email,
        phoneVerified: !!phone,
        role: invite.role,
        status: 'ACTIVE',
      },
    });
    await this.prisma.userInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return { id: user.id, email: user.email, role: user.role };
  }

  async resend(actor: { sub: string }, id: string) {
    const invite = await this.prisma.userInvite.findUnique({ where: { id } });
    if (!invite) throw new NotFoundException();
    if (invite.acceptedAt) throw new BadRequestException('Already accepted');
    // We don't have the raw token anymore (hashed). Reissue.
    const token = randomBytes(24).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.userInvite.update({ where: { id }, data: { tokenHash, expiresAt } });
    const link = `${this.config.get<string>('publicSiteUrl')}/invite/accept?token=${token}`;
    if (invite.email) {
      await this.mail.send('admin-invite', invite.email, { link, role: invite.role });
    }
    return { ok: true, link };
  }

  async revoke(id: string) {
    await this.prisma.userInvite.delete({ where: { id } });
    return { ok: true };
  }
}
