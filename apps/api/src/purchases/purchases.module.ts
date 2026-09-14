import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { OrdersModule } from '../orders/orders.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { AdminPurchasesController } from './admin-purchases.controller';
import { PurchasesRepository } from './purchases.repository';
import { PurchasesService } from './purchases.service';

@Module({
  imports: [SuppliersModule, CatalogModule, OrdersModule],
  controllers: [AdminPurchasesController],
  providers: [PurchasesRepository, PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
