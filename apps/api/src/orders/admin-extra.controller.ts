import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OrdersService } from './orders.service';
import { PaymentsService } from './payments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // Alertas de `/admin/pagos`: revisión estancada y rechazo sin reintento.
  @Get('alerts')
  alerts() {
    return this.payments.listAlerts();
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/reservations')
export class AdminReservationsController {
  constructor(private readonly orders: OrdersService) {}

  // Disparo manual del worker de expiración (útil para Diego y tests).
  @Post('expire-run')
  expireRun() {
    return this.orders
      .expireStaleReservations()
      .then((processed) => ({ processed, count: processed.length }));
  }
}
