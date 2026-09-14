import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { FulfillmentType, ShipmentStatus } from '@prisma/client';

// Avance logístico del pedido (Diego). Paridad con `updateShipment`:
// - respeta SHIPMENT_TRANSITIONS por fulfillment.
// - Olva exige guía en `en_agencia`; App exige evidencia al entregar;
//   Recojo exige DNI al entregar.
// - `realShippingCost` registra el costo real Olva (vs cobrado).
export class AdvanceShipmentDto {
  @IsOptional()
  @IsEnum(FulfillmentType)
  fulfillmentType?: FulfillmentType;

  @IsEnum(ShipmentStatus)
  status!: ShipmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  courier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trackingCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  realShippingCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  pickupName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  pickupDni?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  evidence?: string;
}
