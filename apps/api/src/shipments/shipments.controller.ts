import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from '../orders/orders.service';
import { ShipmentsService } from './shipments.service';

// Timeline de envío de mis pedidos (tracking del cliente).
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class ShipmentsController {
  constructor(
    private readonly orders: OrdersService,
    private readonly shipments: ShipmentsService,
  ) {}

  @Get(':id/shipment')
  async timeline(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const order = await this.orders.getMineOrFail(user.id, id);
    return this.shipments.timeline(order.id);
  }
}
