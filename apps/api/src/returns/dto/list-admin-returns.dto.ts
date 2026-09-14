import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReturnOrigin, ReturnStatus } from '@prisma/client';
import { PaginationDto } from '../../common/pagination';

export class ListAdminReturnsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;

  @IsOptional()
  @IsEnum(ReturnOrigin)
  origin?: ReturnOrigin;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;
}
