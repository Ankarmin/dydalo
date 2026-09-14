import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

class CategoryOrderItem {
  @IsString()
  id!: string;

  @IsInt()
  @Min(0)
  order!: number;
}

// Reordena la grilla de categorías del admin en una sola transacción.
export class ReorderCategoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryOrderItem)
  orders!: CategoryOrderItem[];
}
