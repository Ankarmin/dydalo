import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { MpController } from './mp.controller';
import { MpService } from './mp.service';

// MercadoPago real (Fase 7): Checkout Pro + webhook firmado.
// Sin credenciales opera en mock (ver MpService).
@Module({
  imports: [OrdersModule],
  controllers: [MpController],
  providers: [MpService],
  exports: [MpService],
})
export class MpModule {}
