import { Injectable } from '@nestjs/common';
import type { Prisma, Product, ProductVariant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type ProductWithRelations = Product & {
  category: { slug: string; name: string };
  variants: ProductVariant[];
};

const withRelations = {
  category: { select: { slug: true, name: true } },
  variants: { orderBy: [{ size: 'asc' as const }, { color: 'asc' as const }] },
};

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(
    where: Prisma.ProductWhereInput,
    orderBy: Prisma.ProductOrderByWithRelationInput,
    skip: number,
    take: number,
  ) {
    return this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: withRelations,
      }),
      this.prisma.product.count({ where }),
    ]);
  }

  findBySlug(slug: string): Promise<ProductWithRelations | null> {
    return this.prisma.product.findUnique({
      where: { slug },
      include: withRelations,
    });
  }

  findById(id: string): Promise<ProductWithRelations | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: withRelations,
    });
  }

  findBySku(sku: string) {
    return this.prisma.product.findUnique({ where: { sku } });
  }

  countFeatured(exceptId?: string): Promise<number> {
    return this.prisma.product.count({
      where: {
        featured: true,
        active: true,
        ...(exceptId && { id: { not: exceptId } }),
      },
    });
  }

  create(data: Prisma.ProductCreateInput): Promise<ProductWithRelations> {
    return this.prisma.product.create({ data, include: withRelations });
  }

  update(
    id: string,
    data: Prisma.ProductUpdateInput,
  ): Promise<ProductWithRelations> {
    return this.prisma.product.update({
      where: { id },
      data,
      include: withRelations,
    });
  }

  remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  findVariant(productId: string, variantId: string) {
    return this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
  }

  addVariant(data: Prisma.ProductVariantCreateInput) {
    return this.prisma.productVariant.create({ data });
  }

  updateVariant(id: string, data: Prisma.ProductVariantUpdateInput) {
    return this.prisma.productVariant.update({ where: { id }, data });
  }

  // `product.stock` es agregado de variantes activas: recalcular tras
  // cada alta/edición de variante y cada movimiento de stock (Fase 5).
  async recalcStock(
    productId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const db = tx ?? this.prisma;
    const agg = await db.productVariant.aggregate({
      where: { productId, active: true },
      _sum: { stock: true },
    });
    const stock = agg._sum.stock ?? 0;
    await db.product.update({
      where: { id: productId },
      data: { stock },
    });
    return stock;
  }
}
