import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { IsOptional } from 'class-validator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { RequestUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SiteConfigService } from './site-config.service';

// PATCH sin DTO estricto a propósito: las claves crecen con el negocio
// (faq, hero, textos) y el merge es por clave top-level. `id` se ignora.
class UpdateSiteConfigDto {
  @IsOptional()
  siteName?: unknown;

  @IsOptional()
  siteDescription?: unknown;

  @IsOptional()
  brandSubtitle?: unknown;

  @IsOptional()
  contactEmail?: unknown;

  @IsOptional()
  contactPhone?: unknown;

  @IsOptional()
  address?: unknown;

  @IsOptional()
  socialLinks?: unknown;

  @IsOptional()
  shippingInfo?: unknown;

  @IsOptional()
  returnPolicy?: unknown;

  @IsOptional()
  sizeGuide?: unknown;

  @IsOptional()
  faq?: unknown;

  @IsOptional()
  heroSettings?: unknown;

  @IsOptional()
  maintenanceMode?: unknown;
}

@Controller('site-config')
export class SiteConfigController {
  constructor(private readonly config: SiteConfigService) {}

  @Get()
  get() {
    return this.config.getPublic();
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/site-config')
export class AdminSiteConfigController {
  constructor(private readonly config: SiteConfigService) {}

  @Patch()
  update(@CurrentUser() user: RequestUser, @Body() dto: UpdateSiteConfigDto) {
    return this.config.update(dto, { id: user.id, name: user.name });
  }
}
