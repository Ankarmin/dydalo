import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CouponType } from '@prisma/client';

export function normalizeCouponCode(value: unknown): unknown {
  return typeof value === 'string'
    ? value.trim().toUpperCase().replace(/\s+/g, '')
    : value;
}

export class CreateCouponDto {
  @Transform(({ value }: { value: unknown }) => normalizeCouponCode(value))
  @IsString()
  @MinLength(1, { message: 'El código es requerido' })
  @MaxLength(40)
  code!: string;

  @IsEnum(CouponType, { message: 'Tipo inválido (PERCENT | AMOUNT)' })
  type!: CouponType;

  @IsNumber()
  @Min(0.01, { message: 'El valor debe ser mayor a 0' })
  value!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSubtotal?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateCouponDto {
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100000)
  value?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSubtotal?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ValidateCouponDto {
  @Transform(({ value }: { value: unknown }) => normalizeCouponCode(value))
  @IsString()
  @MinLength(1)
  code!: string;

  @IsNumber()
  @Min(0)
  subtotal!: number;
}
