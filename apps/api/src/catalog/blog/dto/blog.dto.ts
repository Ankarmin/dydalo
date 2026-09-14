import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  @MinLength(4, { message: 'El título es requerido' })
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(4, { message: 'El extracto es requerido' })
  @MaxLength(400)
  excerpt!: string;

  @IsString()
  @MinLength(4, { message: 'El contenido es requerido' })
  content!: string;

  @IsString()
  @MinLength(1, { message: 'La portada es requerida' })
  @MaxLength(500)
  coverImage!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorName?: string;
}

export class UpdateBlogDto {
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(400)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  content?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  coverImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorName?: string;
}
