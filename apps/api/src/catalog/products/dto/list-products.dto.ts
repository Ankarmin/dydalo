import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/pagination';

const SORTS = ['newest', 'price-asc', 'price-desc', 'name'] as const;
export type ProductSort = (typeof SORTS)[number];

function toBoolean(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  return value === true || value === 'true';
}

export class ListProductsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toBoolean(value))
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toBoolean(value))
  active?: boolean;

  @IsOptional()
  @IsIn([...SORTS])
  sort?: ProductSort;
}
