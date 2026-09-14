import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { AdminShipmentsController } from './admin-shipments.controller';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsRepository } from './shipments.repository';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [OrdersModule],
  controllers: [ShipmentsController, AdminShipmentsController],
  providers: [ShipmentsRepository, ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
