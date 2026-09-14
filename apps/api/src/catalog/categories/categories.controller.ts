import { Controller, Get, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';

// Lectura pública para home + catálogo (solo activas, ordenadas).
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@Query('all') all?: string) {
    // `?all=1` lo usa el admin web para previsualizar inactivas
    // (sigue siendo lectura pública, sin datos sensibles).
    return this.categories.list(all !== '1');
  }
}
