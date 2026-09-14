import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../common/pagination';
import { CreateOrderDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

// Mis pedidos del cliente: crear (checkout), listar, ver y cancelar.
// El reintento de pago NO duplica pedido ni stock.
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateOrderDto) {
    return this.orders.createCustomerOrder(user, dto);
  }

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() dto: PaginationDto) {
    return this.orders.listMine(user.id, dto.page, dto.limit);
  }

  @Get(':id')
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orders.getMineOrFail(user.id, id);
  }

  @Get(':id/attempts')
  attempts(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orders.listMyAttempts(user.id, id);
  }

  @Patch(':id/cancel')
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orders.cancelMine(user.id, id);
  }

  @Post(':id/retry')
  retry(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orders.retryMine(user.id, id);
  }
}
