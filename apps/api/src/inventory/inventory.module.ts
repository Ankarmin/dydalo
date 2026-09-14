import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { OrdersModule } from '../orders/orders.module';
import { AdminInventoryController } from './admin-inventory.controller';
import { InventoryService } from './inventory.service';

// Kardex + ajustes manuales (Fase 5). Reutiliza ProductsRepository
// (catálogo) y MovementsRepository (orders): sin duplicar acceso.
@Module({
  imports: [CatalogModule, OrdersModule],
  controllers: [AdminInventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
