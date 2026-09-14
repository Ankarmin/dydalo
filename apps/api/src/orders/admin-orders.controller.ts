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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ListAdminOrdersDto } from './dto/list-admin-orders.dto';
import { AdminCreateOrderDto, TransitionOrderDto } from './dto/order.dto';
import { SimulateWebhookDto, UpdatePaymentDto } from './dto/payment.dto';
import { OrdersService } from './orders.service';
import { PaymentsService } from './payments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly payments: PaymentsService,
  ) {}

  @Get()
  list(@Query() dto: ListAdminOrdersDto) {
    return this.orders.listAdmin(dto);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.orders.getAdminOrFail(id);
  }

  @Post()
  createManual(
    @CurrentUser() user: RequestUser,
    @Body() dto: AdminCreateOrderDto,
  ) {
    return this.orders.createManualOrder(user, dto);
  }

  @Patch(':id/status')
  transition(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: TransitionOrderDto,
  ) {
    return this.orders.transition(id, dto.status, {
      id: user.id,
      name: user.name,
    });
  }

  @Patch(':id/payment')
  updatePayment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.payments.updatePaymentStatus(id, {
      ...dto,
      actor: { id: user.id, name: user.name },
    });
  }

  @Post(':id/payment/simulate-webhook')
  simulateWebhook(@Param('id') id: string, @Body() dto: SimulateWebhookDto) {
    return this.payments.simulateWebhook(id, dto);
  }
}
