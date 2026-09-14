import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { CouponsModule } from '../coupons/coupons.module';
import { UsersModule } from '../users/users.module';
import {
  AdminPaymentsController,
  AdminReservationsController,
} from './admin-extra.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AttemptsRepository } from './attempts.repository';
import { MovementsRepository } from './movements.repository';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { PaymentsService } from './payments.service';
import { ReservationsWorker } from './reservations.worker';

// Núcleo transaccional (Fase 5). Repositorios con soporte de tx:
// las operaciones pedido+intento+cupón+stock+auditoría van en una sola
// transacción o no van (db-use-transactions).
@Module({
  imports: [CatalogModule, CouponsModule, UsersModule],
  controllers: [
    OrdersController,
    AdminOrdersController,
    AdminPaymentsController,
    AdminReservationsController,
  ],
  providers: [
    OrdersRepository,
    AttemptsRepository,
    MovementsRepository,
    OrdersService,
    PaymentsService,
    ReservationsWorker,
  ],
  exports: [
    OrdersService,
    PaymentsService,
    MovementsRepository,
    OrdersRepository,
  ],
})
export class OrdersModule {}
