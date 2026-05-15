import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus, Prisma, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { MailService } from '../mail/mail.service';

interface OrderItemInput {
  serviceId: string;
  quantity?: number;
  meta?: any;
}

interface CreateOrderInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  area?: string;
  preferredDate: string; // ISO
  timeWindow: string;
  notes?: string;
  items: OrderItemInput[];
  otpToken?: string;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly otp: OtpService,
    private readonly mail: MailService,
  ) {}

  private async nextOrderCode() {
    const year = new Date().getFullYear();
    const prefix = (this.config.get<string>('cookiePrefix') || 'ORD').toUpperCase();
    const count = await this.prisma.order.count({
      where: { code: { startsWith: `${prefix}-${year}-` } },
    });
    return `${prefix}-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  async create(input: CreateOrderInput, currentUserId: string | null) {
    if (!input.items?.length) throw new BadRequestException('At least one item required');

    let userId = currentUserId;
    let tempPassword: string | null = null;
    let createdNewUser = false;

    // Phone+OTP verification path is for guest checkout only
    if (!userId) {
      if (!input.otpToken) throw new BadRequestException('OTP token required for guest checkout');
      const { phone } = this.otp.consume(input.otpToken, 'order');
      if (phone !== input.phone) throw new BadRequestException('OTP phone mismatch');
      const existingByPhone = await this.prisma.user.findUnique({ where: { phone: input.phone } });
      const existingByEmail = input.email
        ? await this.prisma.user.findUnique({ where: { email: input.email } })
        : null;
      const existing = existingByPhone || existingByEmail;
      if (existing) {
        userId = existing.id;
      } else {
        // Create auto-account
        tempPassword = randomBytes(6).toString('hex');
        const hash = await bcrypt.hash(tempPassword, 10);
        const created = await this.prisma.user.create({
          data: {
            name: input.name,
            phone: input.phone,
            email: input.email,
            passwordHash: hash,
            phoneVerified: true,
            status: UserStatus.ACTIVE,
            role: 'CUSTOMER',
          },
        });
        userId = created.id;
        createdNewUser = true;
      }
    }

    // Pull service prices
    const serviceIds = input.items.map((i) => i.serviceId);
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds }, deletedAt: null },
    });
    if (services.length !== serviceIds.length) {
      throw new BadRequestException('Some services not found');
    }
    const orderItems = input.items.map((it) => {
      const svc = services.find((s) => s.id === it.serviceId)!;
      const qty = it.quantity ?? 1;
      const unit = svc.basePrice ? Number(svc.basePrice) : 0;
      const lineTotal = unit * qty;
      return {
        serviceId: svc.id,
        quantity: qty,
        unitPrice: new Prisma.Decimal(unit),
        lineTotal: new Prisma.Decimal(lineTotal),
        meta: it.meta ?? Prisma.DbNull,
      };
    });
    const subtotal = orderItems.reduce((s, i) => s + Number(i.lineTotal), 0);
    const code = await this.nextOrderCode();
    const order = await this.prisma.order.create({
      data: {
        code,
        userId: userId!,
        customerName: input.name,
        customerPhone: input.phone,
        customerEmail: input.email,
        address: input.address,
        area: input.area,
        preferredDate: new Date(input.preferredDate),
        timeWindow: input.timeWindow,
        notes: input.notes,
        subtotal: new Prisma.Decimal(subtotal),
        total: new Prisma.Decimal(subtotal),
        items: { create: orderItems },
        statusLogs: { create: [{ status: 'PENDING' }] },
      },
      include: { items: { include: { service: true } } },
    });

    // Send emails
    const totalStr = `BDT ${subtotal.toFixed(2)}`;
    const scheduled = `${order.preferredDate.toISOString().slice(0, 10)} ${order.timeWindow}`;
    if (createdNewUser && tempPassword) {
      await this.mail.send('account-created-from-order', input.email, {
        name: input.name,
        orderCode: order.code,
        email: input.email,
        tempPassword,
      });
    }
    await this.mail.send('order-received', input.email, {
      name: input.name,
      orderCode: order.code,
      total: totalStr,
      scheduled,
    });
    await this.mail.notifyAdmin('new-order-notification', {
      name: input.name,
      phone: input.phone,
      orderCode: order.code,
      orderId: order.id,
      total: totalStr,
    });

    return { order, createdNewUser };
  }

  // ─── Customer-scoped queries ─────────────────────────
  async listMine(userId: string, params: { page?: number; limit?: number; q?: string; status?: OrderStatus }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: Prisma.OrderWhereInput = { userId, deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.q) where.code = { contains: params.q.toUpperCase() };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { items: { include: { service: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getMine(userId: string, code: string) {
    const o = await this.prisma.order.findFirst({
      where: { userId, code, deletedAt: null },
      include: {
        items: { include: { service: true } },
        statusLogs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!o) throw new NotFoundException();
    return o;
  }

  // ─── Admin ────────────────────────────────────────
  async adminList(params: {
    status?: OrderStatus;
    q?: string;
    from?: string;
    to?: string;
    trash?: boolean;
    showCancelled?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 30;
    const where: Prisma.OrderWhereInput = {};
    where.deletedAt = params.trash ? { not: null } : null;
    if (params.status) where.status = params.status;
    else if (!params.showCancelled) where.status = { not: 'CANCELLED' };
    if (params.q) {
      where.OR = [
        { code: { contains: params.q.toUpperCase() } },
        { customerPhone: { contains: params.q } },
        { customerEmail: { contains: params.q, mode: 'insensitive' } },
        { customerName: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) (where.createdAt as any).gte = new Date(params.from);
      if (params.to) (where.createdAt as any).lte = new Date(params.to);
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { items: true, user: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async adminGet(id: string) {
    const o = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { service: true } },
        statusLogs: { orderBy: { createdAt: 'asc' } },
        user: true,
      },
    });
    if (!o) throw new NotFoundException();
    return o;
  }

  async adminUpdate(id: string, data: { address?: string; notes?: string; area?: string; preferredDate?: string; timeWindow?: string }) {
    const patch: Prisma.OrderUpdateInput = {};
    if (data.address !== undefined) patch.address = data.address;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.area !== undefined) patch.area = data.area;
    if (data.timeWindow !== undefined) patch.timeWindow = data.timeWindow;
    if (data.preferredDate !== undefined) patch.preferredDate = new Date(data.preferredDate);
    return this.prisma.order.update({ where: { id }, data: patch });
  }

  async adminChangeStatus(actorId: string, id: string, status: OrderStatus, note?: string) {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    if (status === 'CANCELLED') {
      throw new BadRequestException('Use cancel endpoint instead');
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        statusLogs: {
          create: [{ fromStatus: existing.status, status, note, changedBy: actorId }],
        },
      },
      include: { user: true },
    });
    await this.mail.send('order-status-changed', existing.customerEmail, {
      name: existing.customerName,
      orderCode: existing.code,
      status,
      note,
    });
    return updated;
  }

  async adminCancel(actorId: string, id: string, reason: string) {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    if (!reason) throw new BadRequestException('Cancel reason required');
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
        statusLogs: {
          create: [{ fromStatus: existing.status, status: 'CANCELLED', note: reason, changedBy: actorId }],
        },
      },
    });
    await this.mail.send('order-status-changed', existing.customerEmail, {
      name: existing.customerName,
      orderCode: existing.code,
      status: 'CANCELLED',
      note: reason,
    });
    return updated;
  }

  adminPayment(id: string, paymentStatus: PaymentStatus) {
    return this.prisma.order.update({ where: { id }, data: { paymentStatus } });
  }

  adminSoftDelete(id: string) {
    return this.prisma.order.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  adminRestore(id: string) {
    return this.prisma.order.update({ where: { id }, data: { deletedAt: null } });
  }

  async adminPermanent(actor: { role: string }, id: string) {
    if (actor.role !== 'SUPER_ADMIN') throw new ForbiddenException();
    return this.prisma.order.delete({ where: { id } });
  }
}
