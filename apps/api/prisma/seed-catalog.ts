// Seed espejo del frontend (Fase 4). Fuente única de verdad:
//   - `apps/web/src/config/products.ts` → `products` (con variantes
//     e imágenes ya construidas) + `catalogCategories`.
//   - `configStore.get()` (en Node devuelve los defaults: `window`
//     no existe y `read()` cae al fallback).
//   - Blog: 3 posts literales (igual que `seed-data.ts` del frontend).
//
// Idempotente: upsert por `slug` + upsert de variantes por
// (productId, size, color) → los ids de variante son estables entre
// re-seeds (los referencian carrito/pedidos en Fase 5).
// AVISO: re-ejecutar pisa los productos/categorías DEL SEED con los
// valores del frontend; lo creado por admin (slug nuevo) no se toca.
import { PrismaClient } from '@prisma/client';
import { catalogCategories, products } from '@/config/products';
import { configStore } from '@/lib/stores/data-store.config';
import { variantKey } from '../src/common/variant-key';

// Costos demo del frontend (`seed-data.ts`), mapeados por id de seed.
const DEMO_COSTS: Record<string, number> = {
  '1': 45,
  '31': 70,
  '51': 80,
  '11': 100,
  '91': 25,
  '71': 30,
  '21': 95,
  '41': 70,
  '92': 130,
};

const BLOG_SEED = [
  {
    title: 'The Real Cream — Nueva Colección',
    slug: 'the-real-cream-nueva-coleccion',
    excerpt:
      'Descubre la nueva colección de DYDALO con los esenciales de la temporada.',
    content: 'Contenido del post...',
    coverImage: '/images/dydalo-panoramica.png',
  },
  {
    title: 'Guía de Estilo: Streetwear para el verano',
    slug: 'guia-estilo-streetwear-verano',
    excerpt: 'Tips y combinaciones para dominar el streetwear en días de calor.',
    content: 'Contenido del post...',
    coverImage: '/images/dydalo-tracksuit.jpg',
  },
  {
    title: 'Detrás del Diseño: Sneakers DYDALO',
    slug: 'detras-diseno-sneakers-dydalo',
    excerpt: 'El proceso creativo detrás de nuestro calzado más icónico.',
    content: 'Contenido del post...',
    coverImage: '/images/dydalo-sneakers.jpg',
  },
];

export async function seedCatalog(prisma: PrismaClient): Promise<void> {
  // 1) Categorías.
  for (const c of catalogCategories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        active: c.active,
        order: c.order,
        description: c.description,
        image: c.image,
        sizeGuide: (c.sizeGuide ?? undefined),
      },
      create: {
        slug: c.slug,
        name: c.name,
        active: c.active,
        order: c.order,
        description: c.description,
        image: c.image,
        sizeGuide: (c.sizeGuide ?? undefined),
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
    });
  }
  console.log(`Seed categorías OK: ${catalogCategories.length}`);

  // 2) Productos + variantes (ids estables por upsert).
  let variantCount = 0;
  for (const p of products) {
    const category = await prisma.category.findUnique({
      where: { slug: p.category },
    });
    if (!category) {
      throw new Error(
        `Seed: producto ${p.slug} referencia categoría inexistente ${p.category}`,
      );
    }
    const demoCost = DEMO_COSTS[p.id];
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        categoryId: category.id,
        price: p.price,
        image: p.image,
        images: p.images ?? [],
        colors: p.colors,
        active: p.active,
        featured: p.featured,
        discount: p.discount,
        sku: p.sku,
        description: p.description,
        ...(demoCost !== undefined && { costPrice: demoCost }),
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        updatedAt: new Date(p.updatedAt),
      },
      create: {
        name: p.name,
        slug: p.slug,
        categoryId: category.id,
        price: p.price,
        image: p.image,
        images: p.images ?? [],
        colors: p.colors,
        stock: 0,
        active: p.active,
        featured: p.featured,
        discount: p.discount,
        sku: p.sku,
        description: p.description,
        costPrice: demoCost,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    });
    const seen = new Set<string>();
    for (const v of p.variants ?? []) {
      const key = `${v.size}|${v.color}`;
      seen.add(key);
      await prisma.productVariant.upsert({
        where: {
          productId_size_color: {
            productId: product.id,
            size: v.size,
            color: v.color,
          },
        },
        update: {
          key: variantKey(v.size, v.color),
          stock: v.stock,
          active: v.active,
          lowStockThreshold: v.lowStockThreshold,
          sku: v.sku,
          updatedAt: new Date(v.updatedAt),
        },
        create: {
          productId: product.id,
          key: variantKey(v.size, v.color),
          size: v.size,
          color: v.color,
          stock: v.stock,
          active: v.active,
          lowStockThreshold: v.lowStockThreshold,
          sku: v.sku,
          createdAt: v.createdAt ? new Date(v.createdAt) : undefined,
          updatedAt: new Date(v.updatedAt),
        },
      });
      variantCount += 1;
    }
    // Limpia variantes que el seed ya no trae (quedan las de admin).
    const stale = await prisma.productVariant.findMany({
      where: { productId: product.id },
      select: { id: true, size: true, color: true },
    });
    const staleIds = stale
      .filter((v) => !seen.has(`${v.size}|${v.color}`))
      .map((v) => v.id);
    if (staleIds.length > 0) {
      await prisma.productVariant.deleteMany({
        where: { id: { in: staleIds } },
      });
    }
    const agg = await prisma.productVariant.aggregate({
      where: { productId: product.id, active: true },
      _sum: { stock: true },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: agg._sum.stock ?? 0 },
    });
  }
  console.log(
    `Seed productos OK: ${products.length} (${variantCount} variantes)`,
  );

  // 3) Blog.
  for (const b of BLOG_SEED) {
    await prisma.blogPost.upsert({
      where: { slug: b.slug },
      update: {
        title: b.title,
        excerpt: b.excerpt,
        content: b.content,
        coverImage: b.coverImage,
      },
      create: { ...b, authorId: 'system', authorName: 'DYDALO', published: true },
    });
  }
  console.log(`Seed blog OK: ${BLOG_SEED.length}`);

  // 4) Site config singleton.
  const defaults = configStore.get();
  await prisma.siteConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: defaults.siteName,
      siteDescription: defaults.siteDescription,
      brandSubtitle: defaults.brandSubtitle,
      contactEmail: defaults.contactEmail,
      contactPhone: defaults.contactPhone,
      address: defaults.address,
      socialLinks: defaults.socialLinks,
      shippingInfo: defaults.shippingInfo,
      returnPolicy: defaults.returnPolicy,
      sizeGuide: defaults.sizeGuide,
      faq: defaults.faq,
      heroSettings: defaults.heroSettings,
      maintenanceMode: defaults.maintenanceMode,
    },
  });
  console.log('Seed site_config OK: default');
}
