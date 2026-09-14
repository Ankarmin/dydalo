import { IsIn, IsInt, IsString, MaxLength, MinLength } from 'class-validator';

// Ajuste manual de stock por variante (Diego tras conteo físico).
// Motivo obligatorio (mín 5) y bloqueo de negativo, paridad frontend.
// `damage` registra merma (K-01); el resto es `manual_adjustment`.
export class AdjustStockDto {
  @IsString()
  productId!: string;

  @IsString()
  variantId!: string;

  @IsInt()
  quantityChange!: number;

  @IsIn(['manual_adjustment', 'damage'])
  type!: 'manual_adjustment' | 'damage';

  @IsString()
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
  @MaxLength(500)
  reason!: string;
}

export class ListMovementsDto {
  @IsString()
  @MinLength(1)
  productId!: string;
}
