import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

// Crear variante suelta (el alta normal viene en CreateProductDto).
export class AddVariantDto {
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

// Edición de variante: SIN `stock` a propósito. El stock solo lo mueven
// las operaciones de inventario con kardex (Fase 5): compras, ventas,
// ajustes con motivo y mermas. Aquí: datos comerciales y activación.
export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  size?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  color?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string | null;
}
