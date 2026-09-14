import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

// Global: Fases 5-6 auditan pedidos, pagos, stock y RMA desde sus módulos.
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
