import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ProductColorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;

  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Hex de color inválido' })
  hex!: string;
}

export class ProductVariantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  size!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  color!: string;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string;
}

export class CreateProductDto {
  @IsString()
  @MinLength(2, { message: 'El nombre es requerido' })
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(1, { message: 'La categoría es requerida' })
  categorySlug!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  @MinLength(1, { message: 'La imagen es requerida' })
  @MaxLength(500)
  image!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductColorDto)
  colors!: ProductColorDto[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @IsString()
  @MinLength(1, { message: 'El SKU es requerido' })
  @MaxLength(60)
  sku!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaDescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants!: ProductVariantDto[];
}
