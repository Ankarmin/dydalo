import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.validation';
import { AddressesModule } from './addresses/addresses.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { CouponsModule } from './coupons/coupons.module';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { MpModule } from './mp/mp.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { PurchasesModule } from './purchases/purchases.module';
import { ReturnsModule } from './returns/returns.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { UsersModule } from './users/users.module';

// Módulos por feature, no por capa (arch-feature-modules).
// PrismaModule es global; el resto se importa por feature (Fases 3-6).
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60000, limit: 100 }],
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    AddressesModule,
    AuditModule,
    CatalogModule,
    CouponsModule,
    OrdersModule,
    InventoryModule,
    ShipmentsModule,
    SuppliersModule,
    PurchasesModule,
    ReturnsModule,
    MpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
