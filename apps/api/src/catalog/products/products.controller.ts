import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListProductsDto } from './dto/list-products.dto';
import { ProductsService } from './products.service';

// Lectura pública: home (featured), catálogo (filtros+orden) y detalle.
// Solo productos activos y variantes activas. Sin `costPrice`: es dato
// interno (B-06); el admin lo ve en `/admin/products`.
function withoutCost<T extends { costPrice?: unknown }>(
  p: T,
): Omit<T, 'costPrice'> {
  const rest = { ...p };
  delete rest.costPrice;
  return rest;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  async list(@Query() dto: ListProductsDto) {
    const page = await this.products.list(dto, true);
    return { ...page, data: page.data.map(withoutCost) };
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    return withoutCost(await this.products.getBySlugOrFail(slug, true));
  }
}
