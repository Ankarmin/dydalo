import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

// Cambio de estado de pago (admin o webhook simulado). Paridad frontend:
// - en_revision / verificado_manual exigen motivo.
// - verificado_manual exige evidencia (foto del comprobante).
export class UpdatePaymentDto {
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  method?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mpPaymentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mpStatusDetail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  evidence?: string;
}

// Simula el webhook de MercadoPago (origen mp_online): mapea el estado
// MP al estado interno. En Fase 7 lo reemplaza el webhook firmado real.
export class SimulateWebhookDto {
  @IsString()
  mpStatus!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mpPaymentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mpStatusDetail?: string;
}
