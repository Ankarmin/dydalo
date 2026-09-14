// E2E Fase 5: cupones, pedidos transaccionales, pagos, expiración y kardex.
// Usa producto/categoría/cupones propios (prefijo e2e-): el seed no se toca.
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
const catSlug = `f5-sales-cat-${stamp}`;
const adminEmail = 'diego@dydalo.com';
const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'dydalo-local-dev';
const customerEmail = `sales-e2e+${stamp}@dydalo.test`;
const customerPassword = 'E2eTest123';

type Json = Record<string, unknown>;
const json = (res: request.Response): Json => res.body as Json;

const snapshot = {
  label: 'Casa',
  fullName: 'Sales E2e',
  street: 'Av. Prueba 123',
  district: 'Miraflores',
  city: 'Lima',
  state: 'Lima',
  phone: '999888777',
};

describe('Ventas transaccionales (e2e)', () => {
  let app: Awaited<ReturnType<TestingModule['createNestApplication']>>;
  let admin: request.Agent;
  let customer: request.Agent;
  let customerId = '';
  let productId = '';
  const anon = () => request(app.getHttpServer() as App);

  const item = (size: string, color: string, quantity: number) => ({
    productId,
    size,
    color,
    quantity,
  });

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
      firstName: 'Sales',
      lastName: 'E2e',
      email: customerEmail,
      phone: '999888777',
      password: customerPassword,
    });
    expect(register.status).toBe(201);
    customerId = json(register).id as string;

    const cat = await admin.post('/admin/categories').send({
      slug: catSlug,
      name: 'E2E Sales',
    });
    expect(cat.status).toBe(201);

    const product = await admin.post('/admin/products').send({
      name: `F5 Sales Polo ${stamp}`,
      categorySlug: catSlug,
      price: 100,
      image: '/images/e2e.jpg',
      colors: [{ name: 'Negro', hex: '#1a1a1a' }],
      sku: `F5-SALES-${stamp}`,
      variants: [
        { size: 'S', color: 'Negro', stock: 5 },
        { size: 'M', color: 'Negro', stock: 2 },
      ],
    });
    expect(product.status).toBe(201);
    productId = json(product).id as string;

    const coupon = await admin.post('/admin/coupons').send({
      code: `F510-${stamp}`,
      type: 'PERCENT',
      value: 10,
      maxUses: 100,
    });
    expect(coupon.status).toBe(201);
  });

  afterAll(async () => {
    const e2eOrders = await prisma.order.findMany({
      where: { items: { some: { productId } } },
      select: { id: true },
    });
    const orderIds = e2eOrders.map((o) => o.id);
    await prisma.couponRedemption.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    await prisma.stockMovement.deleteMany({
      where: { productId },
    });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.category.deleteMany({ where: { slug: catSlug } });
    await prisma.coupon.deleteMany({
      where: { code: { startsWith: 'F5' } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'sales-e2e+' } },
    });
    await prisma.$disconnect();
    await app.close();
  });

  it('cupón: valida, calcula y rechaza duplicados de código', async () => {
    const ok = await customer.post('/coupons/validate').send({
      code: `F510-${stamp}`,
      subtotal: 200,
    });
    expect(ok.status).toBe(200);
    expect(json(ok).valid).toBe(true);
    expect(json(ok).discount).toBe(20);

    const bad = await customer.post('/coupons/validate').send({
      code: 'NO-EXISTE',
      subtotal: 200,
    });
    expect(json(bad).valid).toBe(false);

    const dupe = await admin.post('/admin/coupons').send({
      code: `F510-${stamp}`,
      type: 'AMOUNT',
      value: 5,
    });
    expect(dupe.status).toBe(409);

    const over = await admin.post('/admin/coupons').send({
      code: `F5E-OVER-${stamp}`,
      type: 'PERCENT',
      value: 150,
    });
    expect(over.status).toBe(400);
  });

  it('checkout: crea pedido con reserva, intento y uso de cupón', async () => {
    const res = await customer.post('/orders').send({
      items: [item('S', 'Negro', 2), item('M', 'Negro', 1)],
      fulfillmentType: 'LIMA_APP',
      couponCode: `F510-${stamp}`,
      shippingAddress: snapshot,
    });
    expect(res.status).toBe(201);
    const body = json(res);
    // subtotal 300 − cupón 30 + envío 0.
    expect(body.subtotal).toBe(300);
    expect(body.discount).toBe(30);
    expect(body.total).toBe(270);
    expect(body.stockReserved).toBe(true);
    expect(body.paymentStatus).toBe('pendiente');
    expect(body.origin).toBe('mp_online');

    const variant = await prisma.productVariant.findFirstOrThrow({
      where: { productId, size: 'S', color: 'Negro' },
    });
    expect(variant.stock).toBe(3);

    const movements = await prisma.stockMovement.findMany({
      where: { orderId: body.id as string },
    });
    expect(movements).toHaveLength(2);
    expect(movements[0]?.type).toBe('reservation');

    const attempts = await prisma.paymentAttempt.findMany({
      where: { orderId: body.id as string },
    });
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.status).toBe('pendiente');
  });

  it('cupón: segundo uso del mismo cliente → 400', async () => {
    const res = await customer.post('/orders').send({
      items: [item('S', 'Negro', 1)],
      couponCode: `F510-${stamp}`,
      shippingAddress: snapshot,
    });
    expect(res.status).toBe(400);
  });

  it('stock: sin suficiente → 409 y carrera concurrente no sobrevende', async () => {
    const poor = await customer.post('/orders').send({
      items: [item('M', 'Negro', 99)],
      shippingAddress: snapshot,
    });
    expect(poor.status).toBe(409);

    // M/Negro quedó con 1 unidad: dos pedidos simultáneos, uno gana.
    const [a, b] = await Promise.all([
      customer.post('/orders').send({
        items: [item('M', 'Negro', 1)],
        shippingAddress: snapshot,
      }),
      customer.post('/orders').send({
        items: [item('M', 'Negro', 1)],
        shippingAddress: snapshot,
      }),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 409]);
    const variant = await prisma.productVariant.findFirstOrThrow({
      where: { productId, size: 'M', color: 'Negro' },
    });
    expect(variant.stock).toBe(0);
  });

  it('cliente: reintentar crea intento sin duplicar pedido', async () => {
    const created = await customer.post('/orders').send({
      items: [item('S', 'Negro', 1)],
      shippingAddress: snapshot,
    });
    const id = json(created).id as string;
    const retry = await customer.post(`/orders/${id}/retry`);
    expect(retry.status).toBe(201);
    const attempts = await prisma.paymentAttempt.findMany({
      where: { orderId: id },
      orderBy: { attemptNumber: 'asc' },
    });
    expect(attempts.map((at) => at.attemptNumber)).toEqual([1, 2]);
  });

  it('webhook simulado: accredited → aprobado (venta definitiva solo audita)', async () => {
    const created = await customer.post('/orders').send({
      items: [item('S', 'Negro', 1)],
      shippingAddress: snapshot,
    });
    const id = json(created).id as string;
    const hook = await admin
      .post(`/admin/orders/${id}/payment/simulate-webhook`)
      .send({ mpStatus: 'accredited', mpPaymentId: `mp-${stamp}` });
    expect(hook.status).toBe(201);
    expect((json(hook).order as Json).paymentStatus).toBe('aprobado');

    const dupe = await admin
      .post(`/admin/orders/${id}/payment/simulate-webhook`)
      .send({ mpStatus: 'accredited', mpPaymentId: `mp-${stamp}` });
    expect(json(dupe).duplicate as boolean).toBe(true);

    const noRetry = await customer.post(`/orders/${id}/retry`);
    expect(noRetry.status).toBe(409);

    const movements = await prisma.stockMovement.findMany({
      where: { orderId: id },
    });
    // Solo la reserva: aprobar no mueve stock (paridad frontend).
    expect(movements.every((m) => m.type === 'reservation')).toBe(true);
  });

  it('pago manual: exige motivo y evidencia', async () => {
    const manual = await admin.post('/admin/orders').send({
      customerId,
      origin: 'manual',
      paymentMethod: 'Yape',
      items: [item('S', 'Negro', 1)],
      shippingAddress: snapshot,
    });
    expect(manual.status).toBe(201);
    const id = json(manual).id as string;
    expect(json(manual).origin).toBe('manual');

    const noReason = await admin.patch(`/admin/orders/${id}/payment`).send({
      status: 'verificado_manual',
      evidence: '/images/yape.jpg',
    });
    expect(noReason.status).toBe(400);

    const noEvidence = await admin.patch(`/admin/orders/${id}/payment`).send({
      status: 'verificado_manual',
      reason: 'Yape verificado por WhatsApp',
    });
    expect(noEvidence.status).toBe(400);

    const ok = await admin.patch(`/admin/orders/${id}/payment`).send({
      status: 'verificado_manual',
      reason: 'Yape verificado por WhatsApp',
      evidence: '/images/yape.jpg',
    });
    expect(ok.status).toBe(200);
    expect((json(ok).order as Json).paymentStatus).toBe('verificado_manual');
  });

  it('expiración: libera stock y cancela con intento sistema', async () => {
    const topUp = await prisma.productVariant.findFirstOrThrow({
      where: { productId, size: 'S', color: 'Negro' },
    });
    await admin.post('/admin/inventory/adjust').send({
      productId,
      variantId: topUp.id,
      quantityChange: 5,
      type: 'manual_adjustment',
      reason: 'Stock para test de expiración',
    });
    const created = await customer.post('/orders').send({
      items: [item('S', 'Negro', 1)],
      shippingAddress: snapshot,
    });
    const id = json(created).id as string;
    const before = await prisma.productVariant.findFirstOrThrow({
      where: { productId, size: 'S', color: 'Negro' },
    });
    await prisma.order.update({
      where: { id },
      data: { reservationExpiryAt: new Date(Date.now() - 1000) },
    });
    const run = await admin.post('/admin/reservations/expire-run');
    expect(run.status).toBe(201);
    expect(((json(run).processed as string[]) ?? []).includes(id)).toBe(true);

    const order = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(order.status).toBe('cancelado');
    expect(order.stockReserved).toBe(false);
    const after = await prisma.productVariant.findFirstOrThrow({
      where: { productId, size: 'S', color: 'Negro' },
    });
    expect(after.stock).toBe(before.stock + 1);
    const released = await prisma.stockMovement.findFirst({
      where: { orderId: id, type: 'release_reservation' },
    });
    expect(released).toBeDefined();

    // Idempotente: segunda corrida no reprocesa.
    const rerun = await admin.post('/admin/reservations/expire-run');
    expect(((json(rerun).processed as string[]) ?? []).includes(id)).toBe(
      false,
    );
  });

  it('transiciones: flujo válido, inválido bloqueado, cancelar restaura', async () => {
    // Stock propio del test (los anteriores consumen el seed del producto).
    const variant = await prisma.productVariant.findFirstOrThrow({
      where: { productId, size: 'S', color: 'Negro' },
    });
    await admin.post('/admin/inventory/adjust').send({
      productId,
      variantId: variant.id,
      quantityChange: 10,
      type: 'manual_adjustment',
      reason: 'Stock para test de transiciones',
    });
    const created = await customer.post('/orders').send({
      items: [item('S', 'Negro', 1)],
      shippingAddress: snapshot,
    });
    const id = json(created).id as string;

    const bad = await admin.patch(`/admin/orders/${id}/status`).send({
      status: 'entregado',
    });
    expect(bad.status).toBe(409);

    for (const status of ['confirmado', 'enviado', 'entregado']) {
      const res = await admin.patch(`/admin/orders/${id}/status`).send({
        status,
      });
      expect(res.status).toBe(200);
    }

    const mine = await customer.post('/orders').send({
      items: [item('S', 'Negro', 1)],
      shippingAddress: snapshot,
    });
    const mineId = json(mine).id as string;
    const before = await prisma.productVariant.findFirstOrThrow({
      where: { productId, size: 'S', color: 'Negro' },
    });
    const cancelled = await customer.patch(`/orders/${mineId}/cancel`);
    expect(cancelled.status).toBe(200);
    const after = await prisma.productVariant.findFirstOrThrow({
      where: { productId, size: 'S', color: 'Negro' },
    });
    expect(after.stock).toBe(before.stock + 1);
  });

  it('kardex: ajuste manual con motivo, bloqueo negativo y merma', async () => {
    const variant = await prisma.productVariant.findFirstOrThrow({
      where: { productId, size: 'S', color: 'Negro' },
    });
    const adjust = await admin.post('/admin/inventory/adjust').send({
      productId,
      variantId: variant.id,
      quantityChange: 5,
      type: 'manual_adjustment',
      reason: 'Conteo físico de Diego',
    });
    expect(adjust.status).toBe(201);
    expect(json(adjust).quantityAfter).toBe(variant.stock + 5);

    const short = await admin.post('/admin/inventory/adjust').send({
      productId,
      variantId: variant.id,
      quantityChange: 2,
      type: 'manual_adjustment',
      reason: 'abc',
    });
    expect(short.status).toBe(400);

    const negative = await admin.post('/admin/inventory/adjust').send({
      productId,
      variantId: variant.id,
      quantityChange: -(variant.stock + 100),
      type: 'manual_adjustment',
      reason: 'Ajuste que dejaría negativo',
    });
    expect(negative.status).toBe(409);

    const damage = await admin.post('/admin/inventory/adjust').send({
      productId,
      variantId: variant.id,
      quantityChange: -1,
      type: 'damage',
      reason: 'Prenda rota en almacén',
    });
    expect(damage.status).toBe(201);

    const kardex = await admin.get(
      `/admin/inventory/movements/${productId}?variantId=${variant.id}`,
    );
    expect(kardex.status).toBe(200);
    const types = (kardex.body as { data: Array<{ type: string }> }).data.map(
      (m) => m.type,
    );
    expect(types).toEqual(
      expect.arrayContaining(['manual_adjustment', 'damage', 'reservation']),
    );
  });

  it('admin: detalle completo y alertas', async () => {
    const mine = await anon()
      .get('/admin/orders?origin=mp_online&limit=5')
      .set('Cookie', '');
    expect(mine.status).toBe(401);

    const list = await admin.get('/admin/orders?origin=mp_online&limit=5');
    expect(list.status).toBe(200);
    expect(json(list).total as number).toBeGreaterThan(0);

    const firstId = (json(list).data as Array<{ id: string }>)[0].id;
    const detail = await admin.get(`/admin/orders/${firstId}`);
    expect(detail.status).toBe(200);
    expect(json(detail).attempts).toBeDefined();
    expect(json(detail).movements).toBeDefined();
    expect(json(detail).audit).toBeDefined();

    const alerts = await admin.get('/admin/payments/alerts');
    expect(alerts.status).toBe(200);
    expect(json(alerts).stuckInReview).toBeDefined();
    expect(json(alerts).rejectedWithoutRetry).toBeDefined();
  });
});
