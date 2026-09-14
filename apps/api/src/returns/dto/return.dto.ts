import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ReturnReason, ReturnStatus } from '@prisma/client';

export class ReturnLineDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsEnum(ReturnReason)
  reason!: ReturnReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonNote?: string;
}

export class CreateReturnDto {
  @IsString()
  orderId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnLineDto)
  items!: ReturnLineDto[];
}

export class AdminCreateReturnDto extends CreateReturnDto {
  // Si se omite, se usa el dueño del pedido.
  @IsOptional()
  @IsString()
  userId?: string;
}

export class SetReturnStatusDto {
  @IsEnum(ReturnStatus)
  status!: ReturnStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ReceiveReturnDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveReturnLineDto)
  lines!: ReceiveReturnLineDto[];
}

class ReceiveReturnLineDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsInt()
  @Min(0)
  quantity!: number;
}

export class InspectReturnDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InspectReturnLineDto)
  lines!: InspectReturnLineDto[];
}

class InspectReturnLineDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsInt()
  @Min(0)
  restock!: number;

  @IsInt()
  @Min(0)
  damage!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  evidence?: string;
}

export class CloseReturnDto {
  @IsNumber()
  @Min(0)
  refundAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  refundNote?: string;
}
