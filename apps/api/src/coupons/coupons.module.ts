import { Module } from '@nestjs/common';
import { AdminCouponsController } from './admin-coupons.controller';
import { CouponsController } from './coupons.controller';
import { CouponsRepository } from './coupons.repository';
import { CouponsService } from './coupons.service';

@Module({
  controllers: [CouponsController, AdminCouponsController],
  providers: [CouponsRepository, CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
