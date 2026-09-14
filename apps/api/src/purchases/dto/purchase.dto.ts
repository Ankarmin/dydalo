import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PurchaseLineDto {
  @IsString()
  productId!: string;

  // Opcional: si se indica, todo entra a esa variante; si no, se reparte
  // entre las variantes activas (paridad con el frontend).
  @IsOptional()
  @IsString()
  variantId?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitCost!: number;
}

export class CreatePurchaseDto {
  @IsString()
  supplierId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  lines!: PurchaseLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ReceiveLineDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class ReceivePurchaseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveLineDto)
  lines!: ReceiveLineDto[];
}
