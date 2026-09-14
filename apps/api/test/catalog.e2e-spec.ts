// E2E Fase 4: catálogo público + admin CRUD con auditoría.
// Requiere seed corrido (`prisma db seed`) y usa al admin del seed
// (password solo local vía ADMIN_SEED_PASSWORD). Todo lo creado lleva
// prefijo e2e- y se limpia al final.
// Correr con: `pnpm --filter api test:e2e` (DB levantada: `db:up`).

import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

const prisma = new PrismaClient();
const stamp = Date.now();
const catSlug = `e2e-cat-${stamp}`;
const adminEmail = 'diego@dydalo.com';
const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'dydalo-local-dev';
const customerEmail = `cat-e2e+${stamp}@dydalo.test`;
const customerPassword = 'E2eTest123';

type Json = Record<string, unknown>;
const json = (res: request.Response): Json => res.body as Json;

describe('Catálogo (e2e)', () => {
  let app: Awaited<ReturnType<TestingModule['createNestApplication']>>;
  let admin: request.Agent;
  let customer: request.Agent;
  const anon = () => request(app.getHttpServer() as App);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    admin = request.agent(app.getHttpServer() as App);
    const adminLogin = await admin
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    expect(adminLogin.status).toBe(200);

    customer = request.agent(app.getHttpServer() as App);
    const register = await customer.post('/auth/register').send({
      firstName: 'Cat',
      lastName: 'E2e',
      email: customerEmail,
      phone: '999888777',
      password: customerPassword,
    });
    expect(register.status).toBe(201);
  });

  afterAll(async () => {
    const e2eProducts = await prisma.product.findMany({
      where: { slug: { startsWith: 'e2e-' } },
      select: { id: true },
    });
    await prisma.product.deleteMany({
      where: { id: { in: e2eProducts.map((p) => p.id) } },
    });
    await prisma.category.deleteMany({
      where: { slug: { startsWith: 'e2e-' } },
    });
    await prisma.blogPost.deleteMany({
      where: { slug: { startsWith: 'e2e-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'cat-e2e+' } },
    });
    await prisma.$disconnect();
    await app.close();
  });

  it('público: categorías, productos, blog y config del seed', async () => {
    const categories = await anon().get('/categories');
    expect(categories.status).toBe(200);
    const slugs = (categories.body as Array<{ slug: string }>).map(
      (c) => c.slug,
    );
    expect(slugs).toEqual(expect.arrayContaining(['polos', 'accesorios']));

    const featured = await anon().get('/products?featured=true&limit=50');
    expect(featured.status).toBe(200);
    expect(json(featured).total as number).toBeGreaterThanOrEqual(8);

    const polos = await anon().get('/products?category=polos&limit=5');
    expect(polos.status).toBe(200);
    expect((polos.body as { data: unknown[] }).data.length).toBeGreaterThan(0);

    const firstSlug = (polos.body as { data: Array<{ slug: string }> }).data[0]
      .slug;
    const detail = await anon().get(`/products/${firstSlug}`);
    expect(detail.status).toBe(200);
    expect(json(detail).slug).toBe(firstSlug);
    expect(
      ((json(detail).variants as Array<unknown>) ?? []).length,
    ).toBeGreaterThan(0);

    const unknownCategory = await anon().get('/products?category=no-existe');
    expect(unknownCategory.status).toBe(200);
    expect(json(unknownCategory).total).toBe(0);

    const blog = await anon().get('/blog');
    expect(blog.status).toBe(200);
    expect((blog.body as unknown[]).length).toBeGreaterThanOrEqual(3);

    const config = await anon().get('/site-config');
    expect(config.status).toBe(200);
    expect(json(config).siteName).toBe('DYDALO');
  });

  it('admin anónimo/customer en rutas admin → 401/403', async () => {
    expect((await anon().get('/admin/products')).status).toBe(401);
    expect((await customer.post('/admin/categories').send({})).status).toBe(
      403,
    );
    expect((await customer.get('/admin/audit')).status).toBe(403);
  });

  it('admin: CRUD de categoría con auditoría', async () => {
    const created = await admin.post('/admin/categories').send({
      slug: catSlug,
      name: 'E2E Cat',
      order: 99,
    });
    expect(created.status).toBe(201);

    const dupe = await admin.post('/admin/categories').send({
      slug: catSlug,
      name: 'E2E Cat Dupe',
    });
    expect(dupe.status).toBe(409);

    const patched = await admin
      .patch(`/admin/categories/${json(created).id as string}`)
      .send({ name: 'E2E Cat Editada' });
    expect(patched.status).toBe(200);
    expect(json(patched).name).toBe('E2E Cat Editada');
  });

  it('admin: CRUD de producto + variantes recalculan stock', async () => {
    const created = await admin.post('/admin/products').send({
      name: 'E2E Polo Test',
      categorySlug: catSlug,
      price: 99,
      image: '/images/e2e.jpg',
      images: ['/images/e2e.jpg'],
      colors: [{ name: 'Negro', hex: '#1a1a1a' }],
      sku: `E2E-${stamp}`,
      variants: [
        { size: 'S', color: 'Negro', stock: 3 },
        { size: 'M', color: 'Negro', stock: 7 },
      ],
    });
    expect(created.status).toBe(201);
    const productId = json(created).id as string;
    // stock agregado = suma de variantes activas.
    expect(json(created).stock).toBe(10);
    expect(((json(created).variants as Array<unknown>) ?? []).length).toBe(2);

    const withBadCategory = await admin.post('/admin/products').send({
      name: 'E2E Sin Categoría',
      categorySlug: 'no-existe',
      price: 10,
      image: '/images/e2e.jpg',
      colors: [{ name: 'Negro', hex: '#1a1a1a' }],
      sku: `E2E-BAD-${stamp}`,
      variants: [],
    });
    expect(withBadCategory.status).toBe(404);

    const added = await admin
      .post(`/admin/products/${productId}/variants`)
      .send({
        size: 'L',
        color: 'Negro',
        stock: 5,
      });
    expect(added.status).toBe(201);

    const dupeVariant = await admin
      .post(`/admin/products/${productId}/variants`)
      .send({ size: 'S', color: 'Negro', stock: 1 });
    expect(dupeVariant.status).toBe(409);

    const detail = await admin.get(
      `/admin/products/${json(created).slug as string}`,
    );
    expect(json(detail).stock).toBe(15);

    // Desactivar una variante la saca del agregado…
    const variants = json(detail).variants as Array<{
      id: string;
      size: string;
    }>;
    const sizeS = variants.find((v) => v.size === 'S');
    expect(sizeS).toBeDefined();
    const deactivated = await admin
      .patch(`/admin/products/${productId}/variants/${sizeS?.id}`)
      .send({ active: false });
    expect(deactivated.status).toBe(200);
    const afterDeactivation = await admin.get(
      `/admin/products/${json(created).slug as string}`,
    );
    expect(json(afterDeactivation).stock).toBe(12);

    // …y el stock NO se edita por aquí (lo mueve la Fase 5 con kardex).
    const hacked = await admin
      .patch(`/admin/products/${productId}/variants/${sizeS?.id}`)
      .send({ stock: 999, active: false });
    expect(hacked.status).toBe(200);
    const afterHack = await admin.get(
      `/admin/products/${json(created).slug as string}`,
    );
    expect(json(afterHack).stock).toBe(12);

    const priced = await admin
      .patch(`/admin/products/${productId}`)
      .send({ price: 119 });
    expect(priced.status).toBe(200);
    expect(json(priced).price).toBe(119);
  });

  it('admin: límite de 8 destacados', async () => {
    const current = await admin.get('/products?featured=true&limit=50');
    const missing = 8 - (json(current).total as number);
    for (let i = 0; i < missing; i += 1) {
      const res = await admin.post('/admin/products').send({
        name: `E2E Feat ${stamp} ${i}`,
        categorySlug: catSlug,
        price: 10,
        image: '/images/e2e.jpg',
        colors: [{ name: 'Negro', hex: '#1a1a1a' }],
        sku: `E2E-FEAT-${stamp}-${i}`,
        featured: true,
        variants: [{ size: 'Unica', color: 'Negro', stock: 1 }],
      });
      expect(res.status).toBe(201);
    }
    const ninth = await admin.post('/admin/products').send({
      name: `E2E Feat Extra ${stamp}`,
      categorySlug: catSlug,
      price: 10,
      image: '/images/e2e.jpg',
      colors: [{ name: 'Negro', hex: '#1a1a1a' }],
      sku: `E2E-FEAT-${stamp}-x`,
      featured: true,
      variants: [{ size: 'Unica', color: 'Negro', stock: 1 }],
    });
    expect(ninth.status).toBe(409);
  });

  it('admin: blog borrador → publicar → visible → eliminar', async () => {
    const created = await admin.post('/admin/blog').send({
      title: `E2E Post ${stamp}`,
      excerpt: 'Extracto e2e',
      content: 'Contenido e2e',
      coverImage: '/images/e2e.jpg',
    });
    expect(created.status).toBe(201);
    const postId = json(created).id as string;
    expect(json(created).published).toBe(false);

    const beforePublish = await anon().get('/blog');
    expect(
      (beforePublish.body as Array<{ slug: string }>).some(
        (p) => p.slug === (json(created).slug as string),
      ),
    ).toBe(false);

    const published = await admin.patch(`/admin/blog/${postId}/publish`).send();
    expect(published.status).toBe(200);

    const afterPublish = await anon().get('/blog');
    expect(
      (afterPublish.body as Array<{ slug: string }>).some(
        (p) => p.slug === (json(created).slug as string),
      ),
    ).toBe(true);

    const deletePublished = await admin.delete(`/admin/blog/${postId}`);
    expect(deletePublished.status).toBe(409);

    await admin.patch(`/admin/blog/${postId}/unpublish`).send();
    const deleted = await admin.delete(`/admin/blog/${postId}`);
    expect(deleted.status).toBe(204);
  });

  it('admin: site-config se lee público y se edita con auditoría', async () => {
    const before = await anon().get('/site-config');
    const originalPhone = json(before).contactPhone as string;
    const patched = await admin.patch('/admin/site-config').send({
      contactPhone: '+51 999 000 111',
    });
    expect(patched.status).toBe(200);
    expect(json(patched).contactPhone).toBe('+51 999 000 111');
    await admin.patch('/admin/site-config').send({
      contactPhone: originalPhone,
    });
  });

  it('admin: categoría con productos no se elimina (409) + auditoría lista', async () => {
    const blocked = await admin.delete(`/admin/categories/${catSlug}`);
    expect(blocked.status).toBe(404);

    const byId = await admin.get('/admin/categories');
    const cat = (byId.body as Array<{ id: string; slug: string }>).find(
      (c) => c.slug === catSlug,
    );
    expect(cat).toBeDefined();
    const blockedById = await admin.delete(`/admin/categories/${cat?.id}`);
    expect(blockedById.status).toBe(409);

    const audit = await admin.get('/admin/audit?entityType=product&limit=5');
    expect(audit.status).toBe(200);
    expect((audit.body as { total: number }).total).toBeGreaterThan(0);
    const entries = (audit.body as { data: Array<{ createdByName: string }> })
      .data;
    expect(entries.some((e) => e.createdByName.includes('Diego'))).toBe(true);
  });
});
