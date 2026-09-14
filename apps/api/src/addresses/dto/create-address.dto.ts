import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Paridad con el tipo Address del frontend. `city` = provincia y
// `state` = departamento (nomenclatura heredada del store actual).
export class CreateAddressDto {
  @IsString()
  @MinLength(1, { message: 'La etiqueta es requerida' })
  @MaxLength(40)
  label!: string;

  @IsString()
  @MinLength(2, { message: 'El nombre completo es requerido' })
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @MinLength(3, { message: 'La dirección es requerida' })
  @MaxLength(200)
  street!: string;

  @IsString()
  @MinLength(1, { message: 'El distrito es requerido' })
  @MaxLength(100)
  district!: string;

  @IsString()
  @MinLength(1, { message: 'La provincia es requerida' })
  @MaxLength(100)
  city!: string;

  @IsString()
  @MinLength(1, { message: 'El departamento es requerido' })
  @MaxLength(100)
  state!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @Matches(/^\d{9,15}$/, { message: 'Ingresa un teléfono válido' })
  phone!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
