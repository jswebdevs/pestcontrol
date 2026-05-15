import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersService } from './orders.service';
import {
  AdminOrdersController,
  CustomerOrdersController,
  PublicOrdersController,
} from './orders.controller';

@Module({
  imports: [JwtModule.register({})],
  providers: [OrdersService],
  controllers: [AdminOrdersController, CustomerOrdersController, PublicOrdersController],
})
export class OrdersModule {}
