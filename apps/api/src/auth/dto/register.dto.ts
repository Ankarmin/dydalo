import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Paridad con `registerSchema` del frontend (validations/auth.ts):
// nombre 2-50, apellido 2-80, password 8+ con mayúscula y número,
// teléfono 9-15 dígitos.
export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(80)
  lastName!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @Matches(/^\d{9,15}$/, { message: 'Ingresa un teléfono válido' })
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe incluir una mayúscula y un número',
  })
  password!: string;
}
