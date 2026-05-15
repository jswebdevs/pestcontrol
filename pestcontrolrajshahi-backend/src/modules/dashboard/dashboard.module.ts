import { Controller, Get, Injectable, Module, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';

@Injectable()
class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(range: '7d' | '30d' | '90d' = '30d') {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);
    startOfMonth.setHours(0, 0, 0, 0);
    const rangeDays = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const rangeStart = new Date(now);
    rangeStart.setDate(now.getDate() - rangeDays);

    const [
      ordersToday,
      ordersWeek,
      ordersMonth,
      pendingCount,
      revenueRows,
      statusGroups,
      topServices,
      activeCustomers,
    ] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: startOfDay }, deletedAt: null } }),
      this.prisma.order.count({ where: { createdAt: { gte: startOfWeek }, deletedAt: null } }),
      this.prisma.order.count({ where: { createdAt: { gte: startOfMonth }, deletedAt: null } }),
      this.prisma.order.count({ where: { status: 'PENDING', deletedAt: null } }),
      this.prisma.order.findMany({
        where: { paymentStatus: 'PAID', createdAt: { gte: rangeStart } },
        select: { total: true, createdAt: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { deletedAt: null, createdAt: { gte: rangeStart } },
        _count: { status: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['serviceId'],
        _count: { serviceId: true },
        orderBy: { _count: { serviceId: 'desc' } },
        take: 5,
      }),
      this.prisma.user.count({
        where: {
          role: 'CUSTOMER',
          lastLoginAt: { gte: rangeStart },
          deletedAt: null,
        },
      }),
    ]);

    const revenueTotal = revenueRows.reduce((s, r) => s + Number(r.total), 0);
    const revenueWeek = revenueRows
      .filter((r) => r.createdAt >= startOfWeek)
      .reduce((s, r) => s + Number(r.total), 0);
    const revenueToday = revenueRows
      .filter((r) => r.createdAt >= startOfDay)
      .reduce((s, r) => s + Number(r.total), 0);

    const topServiceIds = topServices.map((t) => t.serviceId);
    const services = await this.prisma.service.findMany({
      where: { id: { in: topServiceIds } },
      select: { id: true, name: true },
    });

    return {
      ordersToday,
      ordersWeek,
      ordersMonth,
      pendingCount,
      revenueToday,
      revenueWeek,
      revenueTotal,
      statusGroups: statusGroups.map((g) => ({ status: g.status, count: g._count.status })),
      topServices: topServices.map((t) => ({
        serviceId: t.serviceId,
        name: services.find((s) => s.id === t.serviceId)?.name,
        count: t._count.serviceId,
      })),
      activeCustomers,
    };
  }
}

@Controller({ path: 'admin/dashboard', version: '1' })
@UseGuards(JwtAdminGuard)
class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @Get('summary')
  summary(@Query('range') range?: '7d' | '30d' | '90d') {
    return this.svc.summary(range);
  }
}

@Module({
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
