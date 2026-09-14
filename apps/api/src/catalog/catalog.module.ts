import { Module } from '@nestjs/common';
import { AdminAuditController } from './audit/admin-audit.controller';
import { AdminBlogController } from './blog/admin-blog.controller';
import { BlogController } from './blog/blog.controller';
import { BlogService } from './blog/blog.service';
import { AdminCategoriesController } from './categories/admin-categories.controller';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesRepository } from './categories/categories.repository';
import { CategoriesService } from './categories/categories.service';
import { AdminProductsController } from './products/admin-products.controller';
import { ProductsController } from './products/products.controller';
import { ProductsRepository } from './products/products.repository';
import { ProductsService } from './products/products.service';
import {
  AdminSiteConfigController,
  SiteConfigController,
} from './site-config/site-config.controller';
import { SiteConfigService } from './site-config/site-config.service';

// Catálogo (Fase 4). AuditModule es global: los servicios auditan sin
// importarlo. ProductsService reutiliza CategoriesRepository para
// resolver `categorySlug` → FK.
@Module({
  controllers: [
    CategoriesController,
    AdminCategoriesController,
    ProductsController,
    AdminProductsController,
    BlogController,
    AdminBlogController,
    SiteConfigController,
    AdminSiteConfigController,
    AdminAuditController,
  ],
  providers: [
    CategoriesRepository,
    CategoriesService,
    ProductsRepository,
    ProductsService,
    BlogService,
    SiteConfigService,
  ],
  exports: [ProductsService, CategoriesService, ProductsRepository],
})
export class CatalogModule {}
