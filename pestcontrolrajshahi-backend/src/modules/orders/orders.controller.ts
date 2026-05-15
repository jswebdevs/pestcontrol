import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { FastifyRequest } from 'fastify';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtCustomerGuard } from '../../common/guards/jwt-customer.guard';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'orders', version: '1' })
export class PublicOrdersController {
  constructor(
    private readonly svc: OrdersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Public endpoint: works for both guest (with otpToken) and logged-in customer. */
  @Public()
  @Post()
  async create(@Body() body: any, @Req() req: FastifyRequest) {
    const cookies = (req as any).cookies || {};
    const prefix = this.config.get<string>('cookiePrefix');
    const accessCookie = cookies[`${prefix}_customer_access`];
    let currentUserId: string | null = null;
    if (accessCookie) {
      try {
        const decoded: any = this.jwt.verify(accessCookie, {
          secret: this.config.get<string>('jwt.accessSecret')!,
        });
        if (decoded.scope === 'CUSTOMER') currentUserId = decoded.sub;
      } catch {
        /* not logged in, continue as guest */
      }
    }
    return this.svc.create(body, currentUserId);
  }
}

@Controller({ path: 'users/me/orders', version: '1' })
@UseGuards(JwtCustomerGuard)
export class CustomerOrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Get()
  list(
    @CurrentUser() u: JwtUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.svc.listMine(u.sub, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      q,
      status,
    });
  }

  @Get(':code')
  get(@CurrentUser() u: JwtUser, @Param('code') code: string) {
    return this.svc.getMine(u.sub, code);
  }
}

@Controller({ path: 'admin/orders', version: '1' })
@UseGuards(JwtAdminGuard)
export class AdminOrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Get()
  list(
    @Query('status') status?: OrderStatus,
    @Query('q') q?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('trash') trash?: string,
    @Query('showCancelled') showCancelled?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.adminList({
      status,
      q,
      from,
      to,
      trash: trash === 'true',
      showCancelled: showCancelled === 'true',
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('trash')
  trash(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.svc.adminList({ trash: true, page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.adminGet(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.adminUpdate(id, body);
  }

  @Patch(':id/status')
  status(
    @CurrentUser() actor: JwtUser,
    @Param('id') id: string,
    @Body() body: { status: OrderStatus; note?: string },
  ) {
    return this.svc.adminChangeStatus(actor.sub, id, body.status, body.note);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() actor: JwtUser,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.svc.adminCancel(actor.sub, id, body.reason);
  }

  @Patch(':id/payment')
  payment(@Param('id') id: string, @Body() body: { paymentStatus: PaymentStatus }) {
    return this.svc.adminPayment(id, body.paymentStatus);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.svc.adminSoftDelete(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.svc.adminRestore(id);
  }

  @Delete(':id/permanent')
  permanent(@CurrentUser() actor: JwtUser, @Param('id') id: string) {
    return this.svc.adminPermanent(actor, id);
  }
}
