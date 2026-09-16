import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { MpModule } from '../mp/mp.module';
import { OrdersModule } from '../orders/orders.module';
import { AdminReturnsController } from './admin-returns.controller';
import { ReturnsController } from './returns.controller';
import { ReturnsRepository } from './returns.repository';
import { ReturnsService } from './returns.service';

// Postventa RMA (Fase 6). Reutiliza OrdersService (transición a devuelto
// vía rma), PaymentsService (reembolso), MovementsRepository (kardex)
// y MpService (reembolso real en MercadoPago).
@Module({
  imports: [OrdersModule, CatalogModule, MpModule],
  controllers: [ReturnsController, AdminReturnsController],
  providers: [ReturnsRepository, ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
