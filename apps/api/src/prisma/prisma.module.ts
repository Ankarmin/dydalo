import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global: evita importar PrismaModule en cada feature module
// (arch-module-sharing). PrismaService es singleton (default scope).
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
