import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export type Page<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export function pageOf<T>(
  data: T[],
  total: number,
  page = 1,
  limit = 20,
): Page<T> {
  return { data, total, page, limit };
}

export function skipOf(page = 1, limit = 20): number {
  return (Math.max(1, page) - 1) * Math.max(1, Math.min(100, limit));
}
