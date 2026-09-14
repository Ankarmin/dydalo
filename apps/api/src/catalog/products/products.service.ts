import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuditActor } from '../../audit/audit.service';
import { AuditService, diffObjects } from '../../audit/audit.service';
import { slugify } from '../../common/slugify';
import { variantKey } from '../../common/variant-key';
import { CategoriesRepository } from '../categories/categories.repository';
import type { CreateProductDto } from './dto/create-product.dto';
import type { ListProductsDto } from './dto/list-products.dto';
import type { AddVariantDto, UpdateVariantDto } from './dto/variant.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepository } from './products.repository';

// Mismo límite del frontend (`FEATURED_PRODUCTS_COUNT = 8`): 2 filas de
// destacados en la home. Se valida también aquí para que el admin web
// y futuros clientes no lo rompan.
export const FEATURED_PRODUCTS_LIMIT = 8;

@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductsRepository,
    private readonly categories: CategoriesRepository,
    private readonly audit: AuditService,
  ) {}

  private orderByOf(sort?: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'price-asc':
        return { price: 'asc' };
      case 'price-desc':
        return { price: 'desc' };
      case 'name':
        return { name: 'asc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }

  private whereOf(dto: ListProductsDto, publicOnly: boolean) {
    const where: Prisma.ProductWhereInput = {};
    if (publicOnly) {
      where.active = true;
    } else if (dto.active !== undefined) {
      where.active = dto.active;
    }
    if (dto.featured !== undefined) where.featured = dto.featured;
    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { sku: { contains: dto.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async list(dto: ListProductsDto, publicOnly: boolean) {
    let categoryId: string | undefined;
    if (dto.category) {
      const category = await this.categories.findBySlug(dto.category);
      if (!category) {
        return {
          data: [],
          total: 0,
          page: dto.page ?? 1,
          limit: dto.limit ?? 20,
        };
      }
      categoryId = category.id;
    }
    const where = {
      ...this.whereOf(dto, publicOnly),
      ...(categoryId && { categoryId }),
    };
    const page = Math.max(1, dto.page ?? 1);
    const limit = Math.max(1, Math.min(100, dto.limit ?? 20));
    const [data, total] = await this.products.list(
      where,
      this.orderByOf(dto.sort),
      (page - 1) * limit,
      limit,
    );
    const visible = publicOnly
      ? data.map((p) => ({
          ...p,
          variants: p.variants.filter((v) => v.active),
        }))
      : data;
    return { data: visible, total, page, limit };
  }

  async getBySlugOrFail(slug: string, publicOnly: boolean) {
    const product = await this.products.findBySlug(slug);
    if (!product || (publicOnly && !product.active)) {
      throw new NotFoundException('Producto no encontrado');
    }
    if (publicOnly) {
      return { ...product, variants: product.variants.filter((v) => v.active) };
    }
    return product;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'producto';
    let slug = base;
    let n = 2;
    while (await this.products.findBySlug(slug)) {
      slug = `${base}-${n}`;
      n += 1;
    }
    return slug;
  }

  private async assertFeaturedLimit(exceptId?: string): Promise<void> {
    const count = await this.products.countFeatured(exceptId);
    if (count >= FEATURED_PRODUCTS_LIMIT) {
      throw new ConflictException(
        `Límite de ${FEATURED_PRODUCTS_LIMIT} destacados alcanzado: desmarca otro antes`,
      );
    }
  }

  async create(dto: CreateProductDto, actor: AuditActor) {
    const category = await this.categories.findBySlug(dto.categorySlug);
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    if (await this.products.findBySku(dto.sku)) {
      throw new ConflictException('Ya existe un producto con ese SKU');
    }
    if (dto.featured === true) {
      await this.assertFeaturedLimit();
    }
    const slug = await this.uniqueSlug(dto.name);
    // Objetos planos (no instancias del DTO): Prisma Json exige tipos
    // con firma índice implícita.
    const colors = dto.colors.map((c) => ({ name: c.name, hex: c.hex }));
    const product = await this.products.create({
      name: dto.name.trim(),
      slug,
      category: { connect: { id: category.id } },
      price: dto.price,
      image: dto.image,
      images: dto.images ?? [],
      colors,
      stock: 0,
      active: dto.active ?? true,
      featured: dto.featured ?? false,
      discount: dto.discount,
      sku: dto.sku.trim(),
      description: dto.description?.trim(),
      costPrice: dto.costPrice,
      metaTitle: dto.metaTitle?.trim(),
      metaDescription: dto.metaDescription?.trim(),
      variants: {
        create: dto.variants.map((v) => ({
          key: variantKey(v.size, v.color),
          size: v.size.trim(),
          color: v.color.trim(),
          stock: v.stock,
          active: v.active ?? true,
          lowStockThreshold: v.lowStockThreshold,
          sku: v.sku?.trim(),
        })),
      },
    });
    await this.products.recalcStock(product.id);
    const created = await this.products.findById(product.id);
    await this.audit.log({
      entityType: 'product',
      entityId: product.id,
      entityLabel: product.name,
      action: 'create',
      summary: `Producto creado: ${product.name}`,
      after: created ?? product,
      actor,
    });
    return created ?? product;
  }

  async update(id: string, dto: UpdateProductDto, actor: AuditActor) {
    const before = await this.products.findById(id);
    if (!before) {
      throw new NotFoundException('Producto no encontrado');
    }
    if (dto.featured === true && before.featured !== true) {
      await this.assertFeaturedLimit(id);
    }
    let categoryId: string | undefined;
    if (dto.categorySlug) {
      const category = await this.categories.findBySlug(dto.categorySlug);
      if (!category) {
        throw new NotFoundException('Categoría no encontrada');
      }
      categoryId = category.id;
    }
    const product = await this.products.update(id, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(categoryId && { category: { connect: { id: categoryId } } }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.image !== undefined && { image: dto.image }),
      ...(dto.images !== undefined && { images: dto.images }),
      ...(dto.colors !== undefined && {
        colors: dto.colors.map((c) => ({ name: c.name, hex: c.hex })),
      }),
      ...(dto.active !== undefined && { active: dto.active }),
      ...(dto.featured !== undefined && { featured: dto.featured }),
      ...(dto.discount !== undefined && { discount: dto.discount }),
      ...(dto.description !== undefined && {
        description: dto.description?.trim() || null,
      }),
      ...(dto.costPrice !== undefined && { costPrice: dto.costPrice }),
      ...(dto.metaTitle !== undefined && {
        metaTitle: dto.metaTitle?.trim() || null,
      }),
      ...(dto.metaDescription !== undefined && {
        metaDescription: dto.metaDescription?.trim() || null,
      }),
    });
    await this.audit.log({
      entityType: 'product',
      entityId: product.id,
      entityLabel: product.name,
      action: 'update',
      summary: `Producto editado: ${product.name}`,
      before,
      after: product,
      changes: diffObjects(before, product),
      actor,
    });
    return product;
  }

  async remove(id: string, actor: AuditActor) {
    const before = await this.products.findById(id);
    if (!before) {
      throw new NotFoundException('Producto no encontrado');
    }
    await this.products.remove(id);
    await this.audit.log({
      entityType: 'product',
      entityId: id,
      entityLabel: before.name,
      action: 'delete',
      summary: `Producto eliminado: ${before.name}`,
      before,
      actor,
    });
    return { success: true as const };
  }

  async addVariant(productId: string, dto: AddVariantDto, actor: AuditActor) {
    const product = await this.products.findById(productId);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    const dupe = product.variants.find(
      (v) =>
        v.size.toLowerCase() === dto.size.trim().toLowerCase() &&
        v.color.toLowerCase() === dto.color.trim().toLowerCase(),
    );
    if (dupe) {
      throw new ConflictException('Ya existe esa variante (talla + color)');
    }
    const variant = await this.products.addVariant({
      key: variantKey(dto.size, dto.color),
      size: dto.size.trim(),
      color: dto.color.trim(),
      stock: dto.stock,
      active: dto.active ?? true,
      lowStockThreshold: dto.lowStockThreshold,
      sku: dto.sku?.trim(),
      product: { connect: { id: productId } },
    });
    await this.products.recalcStock(productId);
    await this.audit.log({
      entityType: 'product_variant',
      entityId: variant.id,
      entityLabel: `${product.name} (${variant.size}/${variant.color})`,
      action: 'create',
      summary: `Variante creada: ${product.name} ${variant.size}/${variant.color}`,
      after: variant,
      actor,
    });
    return variant;
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
    actor: AuditActor,
  ) {
    const product = await this.products.findById(productId);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    const before = await this.products.findVariant(productId, variantId);
    if (!before) {
      throw new NotFoundException('Variante no encontrada');
    }
    const size = dto.size?.trim() ?? before.size;
    const color = dto.color?.trim() ?? before.color;
    if (
      (size.toLowerCase() !== before.size.toLowerCase() ||
        color.toLowerCase() !== before.color.toLowerCase()) &&
      product.variants.some(
        (v) =>
          v.id !== variantId &&
          v.size.toLowerCase() === size.toLowerCase() &&
          v.color.toLowerCase() === color.toLowerCase(),
      )
    ) {
      throw new ConflictException('Ya existe esa variante (talla + color)');
    }
    const variant = await this.products.updateVariant(variantId, {
      ...(dto.size !== undefined && { size: size }),
      ...(dto.color !== undefined && { color: color }),
      ...((dto.size !== undefined || dto.color !== undefined) && {
        key: variantKey(size, color),
      }),
      ...(dto.active !== undefined && { active: dto.active }),
      ...(dto.lowStockThreshold !== undefined && {
        lowStockThreshold: dto.lowStockThreshold,
      }),
      ...(dto.sku !== undefined && { sku: dto.sku?.trim() || null }),
    });
    await this.products.recalcStock(productId);
    await this.audit.log({
      entityType: 'product_variant',
      entityId: variant.id,
      entityLabel: `${product.name} (${variant.size}/${variant.color})`,
      action: dto.active === false ? 'deactivate' : 'update',
      summary: `Variante editada: ${product.name} ${variant.size}/${variant.color}`,
      before,
      after: variant,
      actor,
    });
    return variant;
  }
}
