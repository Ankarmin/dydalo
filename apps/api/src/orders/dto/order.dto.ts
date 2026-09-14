import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  FulfillmentType,
  OrderOrigin,
  OrderStatus,
  PaymentStatus,
} from '@prisma/client';

export class OrderItemDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  size!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  color!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

// Snapshot congelado de la dirección (igual que el frontend: la dirección
// viva puede cambiar o eliminarse y el pedido conserva la foto).
export class AddressSnapshotDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  label!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  street!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  district!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  state!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string;

  @IsString()
  @Matches(/^\+?\d{9,15}$/, { message: 'Ingresa un teléfono válido' })
  phone!: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsEnum(FulfillmentType)
  fulfillmentType?: FulfillmentType;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  couponCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  shippingAddressId?: string;

  @ValidateNested()
  @Type(() => AddressSnapshotDto)
  shippingAddress!: AddressSnapshotDto;
}

export class AdminCreateOrderDto extends CreateOrderDto {
  @IsString()
  customerId!: string;

  @IsOptional()
  @IsEnum(OrderOrigin)
  origin?: OrderOrigin;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  courier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trackingCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  pickupName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  pickupDni?: string;
}

export class TransitionOrderDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
