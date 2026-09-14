import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  label?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  street?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @Matches(/^\d{9,15}$/, { message: 'Ingresa un teléfono válido' })
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
