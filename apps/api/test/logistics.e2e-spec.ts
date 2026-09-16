// E2E Fase 6: shipments, suppliers, purchases/OC y RMA.
// Todo propio con prefijo f6- (las suites corren en paralelo).
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
const catSlug = `f6-cat-${stamp}`;
const adminEmail = 'diego@dydalo.com';
const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'dydalo-local-dev';
const customerEmail = `logistics-e2e+${stamp}@dydalo.test`;
const customerPassword = 'E2eTest123';

type Json = Record<string, unknown>;
const json = (res: request.Response): Json => res.body as Json;

const snapshot = {
  label: 'Casa',
  fullName: 'Logi E2e',
  street: 'Av. Prueba 123',
  district: 'Miraflores',
  city: 'Lima',
  state: 'Lima',
  phone: '999888777',
};

describe('Logística y postventa (e2e)', () => {
  let app: Awaited<ReturnType<TestingModule['createNestApplication']>>;
  let admin: request.Agent;
  let customer: request.Agent;
  let customerId = '';
  let productId = '';
  let variantS = '';
  let variantM = '';
  const anon = () => request(app.getHttpServer() as App);

  const item = (size: string, color: string, quantity: number) => ({
    productId,
    size,
    color,
    quantity,
  });

  const makeOrder = (
    items: Array<{ size: string; color: string; quantity: number }>,
    fulfillmentType = 'LIMA_APP',
  ) =>
    customer
      .post('/orders')
      .send({ items, fulfillmentType, shippingAddress: snapshot });

  const deliver = async (id: string) => {
    for (const status of ['confirmado', 'enviado', 'entregado']) {
      const res = await admin
        .patch(`/admin/orders/${id}/status`)
        .send({ status });
      expect(res.status).toBe(200);
    }
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Aprueba el pedido vía MP simulado (deja mpPaymentId trazable).
  const approveViaMp = async (orderId: string, tag: string) => {
    const hook = await admin
      .post(`/admin/orders/${orderId}/payment/simulate-webhook`)
      .send({ mpStatus: 'accredited', mpPaymentId: `mp-${tag}` });
    expect(hook.status).toBe(201);
  };

  const mockMpRefund = (id = 'refund-e2e-1') =>
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id }),
    } as Response);

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
      firstName: 'Logi',
      lastName: 'E2e',
      email: customerEmail,
      phone: '999888777',
      password: customerPassword,
    });
    expect(register.status).toBe(201);
    customerId = json(register).id as string;

    const cat = await admin.post('/admin/categories').send({
      slug: catSlug,
      name: 'F6 Cat',
    });
    expect(cat.status).toBe(201);

    const product = await admin.post('/admin/products').send({
      name: `F6 Polo ${stamp}`,
      categorySlug: catSlug,
      price: 100,
      image: '/images/e2e.jpg',
      colors: [{ name: 'Negro', hex: '#1a1a1a' }],
      sku: `F6-${stamp}`,
      variants: [
        { size: 'S', color: 'Negro', stock: 20 },
        { size: 'M', color: 'Negro', stock: 20 },
      ],
    });
    expect(product.status).toBe(201);
    productId = json(product).id as string;
    const variants = json(product).variants as Array<{
      id: string;
      size: string;
    }>;
    variantS = (variants.find((v) => v.size === 'S') as { id: string }).id;
    variantM = (variants.find((v) => v.size === 'M') as { id: string }).id;
  });

  afterAll(async () => {
    await prisma.returnRequest.deleteMany({
      where: { code: { startsWith: 'RMA-' }, order: { userId: customerId } },
    });
    const f6Orders = await prisma.order.findMany({
      where: { items: { some: { productId } } },
      select: { id: true },
    });
    await prisma.order.deleteMany({
      where: { id: { in: f6Orders.map((o) => o.id) } },
    });
    await prisma.stockMovement.deleteMany({ where: { productId } });
    await prisma.purchaseOrder.deleteMany({
      where: { lines: { some: { productId } } },
    });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.category.deleteMany({ where: { slug: catSlug } });
    await prisma.supplier.deleteMany({
      where: { name: { startsWith: 'F6 ' } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'logistics-e2e+' } },
    });
    await prisma.$disconnect();
    await app.close();
  });

  it('proveedores: alta, edición y baja lógica', async () => {
    const created = await admin.post('/admin/suppliers').send({
      name: `F6 Gamarra ${stamp}`,
      contact: 'Juan Pérez',
      phone: '987111222',
    });
    expect(created.status).toBe(201);
    expect(json(created).active).toBe(true);
    const id = json(created).id as string;

    const updated = await admin.patch(`/admin/suppliers/${id}`).send({
      phone: '987111333',
    });
    expect(updated.status).toBe(200);
    expect(json(updated).phone).toBe('987111333');

    const listed = await admin.get('/admin/suppliers');
    expect(
      (listed.body as Array<{ id: string }>).some((s) => s.id === id),
    ).toBe(true);

    const deactivated = await admin.patch(`/admin/suppliers/${id}`).send({
      active: false,
    });
    expect(json(deactivated).active).toBe(false);
  });

  it('compras: OC con recepción parcial/total, stock y costo', async () => {
    const supplier = await admin.post('/admin/suppliers').send({
      name: `F6 OC Supp ${stamp}`,
    });
    const supplierId = json(supplier).id as string;

    const oc = await admin.post('/admin/purchases').send({
      supplierId,
      note: 'Compra e2e',
      lines: [{ productId, variantId: variantS, quantity: 6, unitCost: 45 }],
    });
    expect(oc.status).toBe(201);
    expect(json(oc).status).toBe('pendiente');
    const ocId = json(oc).id as string;

    const before = await prisma.productVariant.findMany({
      where: { productId },
    });
    const stockS0 = (before.find((v) => v.size === 'S') as { stock: number })
      .stock;
    const stockM0 = (before.find((v) => v.size === 'M') as { stock: number })
      .stock;

    // Parcial: 3 de 6 a la variante forzada.
    const partial = await admin.post(`/admin/purchases/${ocId}/receive`).send({
      lines: [{ productId, quantity: 3 }],
    });
    expect(partial.status).toBe(201);
    expect(json(partial).status).toBe('parcial');

    const mid = await prisma.productVariant.findMany({ where: { productId } });
    expect((mid.find((v) => v.size === 'S') as { stock: number }).stock).toBe(
      stockS0 + 3,
    );
    expect((mid.find((v) => v.size === 'M') as { stock: number }).stock).toBe(
      stockM0,
    );

    // Resto (capa al pendiente): completa la OC.
    const rest = await admin.post(`/admin/purchases/${ocId}/receive`).send({
      lines: [{ productId, quantity: 100 }],
    });
    expect(rest.status).toBe(201);
    expect(json(rest).status).toBe('recibida');

    // Sin variante forzada se reparte entre activas (2 S + 2 M).
    const oc2 = await admin.post('/admin/purchases').send({
      supplierId,
      lines: [{ productId, quantity: 4, unitCost: 45 }],
    });
    const oc2Id = json(oc2).id as string;
    await admin.post(`/admin/purchases/${oc2Id}/receive`).send({
      lines: [{ productId, quantity: 4 }],
    });

    const after = await prisma.productVariant.findMany({
      where: { productId },
    });
    expect((after.find((v) => v.size === 'S') as { stock: number }).stock).toBe(
      stockS0 + 8,
    );
    expect((after.find((v) => v.size === 'M') as { stock: number }).stock).toBe(
      stockM0 + 2,
    );

    const movements = await prisma.stockMovement.findMany({
      where: { productId, type: 'purchase' },
    });
    expect(movements.length).toBeGreaterThanOrEqual(3);

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
    });
    expect(product.costPrice).toBe(45);

    const again = await admin.post(`/admin/purchases/${ocId}/receive`).send({
      lines: [{ productId, quantity: 1 }],
    });
    expect(again.status).toBe(409);

    const cancelDone = await admin.patch(`/admin/purchases/${ocId}/cancel`);
    expect(cancelDone.status).toBe(409);

    const oc3 = await admin.post('/admin/purchases').send({
      supplierId,
      lines: [{ productId, quantity: 1, unitCost: 40 }],
    });
    const oc3Id = json(oc3).id as string;
    const cancelled = await admin.patch(`/admin/purchases/${oc3Id}/cancel`);
    expect(cancelled.status).toBe(200);

    const badSupplier = await admin.post('/admin/purchases').send({
      supplierId: 'no-existe',
      lines: [{ productId, quantity: 1, unitCost: 40 }],
    });
    expect(badSupplier.status).toBe(404);
  });

  it('envíos LIMA_APP: flujo, evidencia obligatoria y timeline', async () => {
    const created = await makeOrder([item('S', 'Negro', 1)]);
    const id = json(created).id as string;

    const badJump = await admin.post(`/admin/orders/${id}/shipment`).send({
      status: 'entregado',
    });
    expect(badJump.status).toBe(409);

    expect(
      (
        await admin.post(`/admin/orders/${id}/shipment`).send({
          status: 'conductor_asignado',
          courier: 'inDriver',
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await admin.post(`/admin/orders/${id}/shipment`).send({
          status: 'en_camino',
        })
      ).status,
    ).toBe(201);

    const noEvidence = await admin.post(`/admin/orders/${id}/shipment`).send({
      status: 'entregado',
    });
    expect(noEvidence.status).toBe(400);

    const delivered = await admin.post(`/admin/orders/${id}/shipment`).send({
      status: 'entregado',
      evidence: '/images/entrega.jpg',
    });
    expect(delivered.status).toBe(201);

    const timeline = await customer.get(`/orders/${id}/shipment`);
    expect(timeline.status).toBe(200);
    expect((timeline.body as unknown[]).length).toBe(3);
  });

  it('envíos OLVA y RECOJO: guía y DNI obligatorios', async () => {
    const olva = await makeOrder([item('S', 'Negro', 1)], 'PROVINCIA_OLVA');
    const olvaId = json(olva).id as string;
    expect(json(olva).shipping).toBe(15);

    const noGuide = await admin.post(`/admin/orders/${olvaId}/shipment`).send({
      status: 'en_agencia',
    });
    expect(noGuide.status).toBe(400);

    expect(
      (
        await admin.post(`/admin/orders/${olvaId}/shipment`).send({
          status: 'en_agencia',
          trackingCode: 'OLVA-123',
        })
      ).status,
    ).toBe(201);

    const recojo = await makeOrder([item('S', 'Negro', 1)], 'RECOJO');
    const recojoId = json(recojo).id as string;
    expect(
      (
        await admin.post(`/admin/orders/${recojoId}/shipment`).send({
          status: 'coordinado',
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await admin.post(`/admin/orders/${recojoId}/shipment`).send({
          status: 'listo_para_recojo',
        })
      ).status,
    ).toBe(201);
    const noDni = await admin.post(`/admin/orders/${recojoId}/shipment`).send({
      status: 'entregado',
    });
    expect(noDni.status).toBe(400);
    expect(
      (
        await admin.post(`/admin/orders/${recojoId}/shipment`).send({
          status: 'entregado',
          pickupDni: '12345678',
          pickupName: 'Logi E2e',
        })
      ).status,
    ).toBe(201);

    // Timeline ajeno → 404.
    const other = await anon().get(`/orders/${recojoId}/shipment`);
    expect(other.status).toBe(401);
  });

  it('RMA total: solicitud → cierre con devuelto + reembolso + merma neteada', async () => {
    const created = await makeOrder([item('S', 'Negro', 2)]);
    const id = json(created).id as string;
    await deliver(id);
    await approveViaMp(id, `total-${stamp}`);

    const variant0 = await prisma.productVariant.findFirstOrThrow({
      where: { productId, size: 'S', color: 'Negro' },
    });
    const req = await customer.post('/returns').send({
      orderId: id,
      items: [
        {
          productId,
          variantId: variantS,
          size: 'S',
          color: 'Negro',
          quantity: 2,
          reason: 'talla',
        },
      ],
    });
    expect(req.status).toBe(201);
    expect(json(req).status).toBe('solicitada');
    const rmaId = json(req).id as string;

    expect(
      (
        await admin.patch(`/admin/returns/${rmaId}/status`).send({
          status: 'cerrada',
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await admin.patch(`/admin/returns/${rmaId}/status`).send({
          status: 'aprobada',
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await admin.post(`/admin/returns/${rmaId}/receive`).send({
          lines: [
            {
              productId,
              variantId: variantS,
              size: 'S',
              color: 'Negro',
              quantity: 2,
            },
          ],
        })
      ).status,
    ).toBe(201);

    const inspected = await admin.post(`/admin/returns/${rmaId}/inspect`).send({
      lines: [
        {
          productId,
          variantId: variantS,
          size: 'S',
          color: 'Negro',
          restock: 1,
          damage: 1,
        },
      ],
    });
    expect(inspected.status).toBe(201);
    const variant1 = await prisma.productVariant.findFirstOrThrow({
      where: { productId, size: 'S', color: 'Negro' },
    });
    expect(variant1.stock).toBe(variant0.stock + 1);

    mockMpRefund('refund-total');
    const closed = await admin.post(`/admin/returns/${rmaId}/close`).send({
      refundAmount: 200,
      refundNote: 'Yape',
    });
    expect(closed.status).toBe(201);
    expect((json(closed).rma as Json).status).toBe('cerrada');

    const order = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(order.status).toBe('devuelto');
    expect(order.paymentStatus).toBe('reembolsado');

    const refundAttempts = await prisma.paymentAttempt.findMany({
      where: { orderId: id, status: 'reembolsado' },
    });
    expect(refundAttempts).toHaveLength(1);
    expect(refundAttempts[0]?.mpPaymentId).toBe(`mp-total-${stamp}`);

    const variant2 = await prisma.productVariant.findFirstOrThrow({
      where: { productId, size: 'S', color: 'Negro' },
    });
    // +1 restock en inspect, −1 merma neteada al cerrar.
    expect(variant2.stock).toBe(variant0.stock);

    const damage = await prisma.stockMovement.findFirst({
      where: { orderId: id, type: 'damage' },
    });
    expect(damage?.quantityChange).toBe(-1);
  });

  it('RMA parcial: pedido sigue entregado y merma solo informativa', async () => {
    const created = await makeOrder([item('M', 'Negro', 2)]);
    const id = json(created).id as string;
    await deliver(id);
    await approveViaMp(id, `parcial-${stamp}`);

    const req = await customer.post('/returns').send({
      orderId: id,
      items: [
        {
          productId,
          variantId: variantM,
          size: 'M',
          color: 'Negro',
          quantity: 1,
          reason: 'color',
        },
      ],
    });
    const rmaId = json(req).id as string;
    await admin
      .patch(`/admin/returns/${rmaId}/status`)
      .send({ status: 'aprobada' });
    await admin.post(`/admin/returns/${rmaId}/receive`).send({
      lines: [
        {
          productId,
          variantId: variantM,
          size: 'M',
          color: 'Negro',
          quantity: 1,
        },
      ],
    });
    await admin.post(`/admin/returns/${rmaId}/inspect`).send({
      lines: [
        {
          productId,
          variantId: variantM,
          size: 'M',
          color: 'Negro',
          restock: 0,
          damage: 1,
        },
      ],
    });
    mockMpRefund('refund-parcial');
    const closed = await admin.post(`/admin/returns/${rmaId}/close`).send({
      refundAmount: 50,
    });
    expect(closed.status).toBe(201);

    const order = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(order.status).toBe('entregado');

    const damage = await prisma.stockMovement.findFirst({
      where: { orderId: id, type: 'damage' },
    });
    expect(damage?.quantityChange).toBe(0);
  });

  it('RMA: guardias (SLA, doble devolución, sumas, reembolso tope)', async () => {
    const pending = await makeOrder([item('S', 'Negro', 1)]);
    const pendingId = json(pending).id as string;
    const notDelivered = await customer.post('/returns').send({
      orderId: pendingId,
      items: [
        {
          productId,
          variantId: variantS,
          size: 'S',
          color: 'Negro',
          quantity: 1,
          reason: 'talla',
        },
      ],
    });
    expect(notDelivered.status).toBe(400);
    await deliver(pendingId);
    await approveViaMp(pendingId, `guardias-${stamp}`);

    const otro = await customer.post('/returns').send({
      orderId: pendingId,
      items: [
        {
          productId,
          variantId: variantS,
          size: 'S',
          color: 'Negro',
          quantity: 1,
          reason: 'otro',
        },
      ],
    });
    expect(otro.status).toBe(400);

    const first = await customer.post('/returns').send({
      orderId: pendingId,
      items: [
        {
          productId,
          variantId: variantS,
          size: 'S',
          color: 'Negro',
          quantity: 1,
          reason: 'talla',
        },
      ],
    });
    expect(first.status).toBe(201);
    const firstId = json(first).id as string;

    const dupe = await customer.post('/returns').send({
      orderId: pendingId,
      items: [
        {
          productId,
          variantId: variantS,
          size: 'S',
          color: 'Negro',
          quantity: 1,
          reason: 'talla',
        },
      ],
    });
    expect(dupe.status).toBe(400);

    await admin
      .patch(`/admin/returns/${firstId}/status`)
      .send({ status: 'aprobada' });
    await admin.post(`/admin/returns/${firstId}/receive`).send({
      lines: [
        {
          productId,
          variantId: variantS,
          size: 'S',
          color: 'Negro',
          quantity: 1,
        },
      ],
    });
    const badInspect = await admin
      .post(`/admin/returns/${firstId}/inspect`)
      .send({
        lines: [
          {
            productId,
            variantId: variantS,
            size: 'S',
            color: 'Negro',
            restock: 1,
            damage: 1,
          },
        ],
      });
    expect(badInspect.status).toBe(400);
    await admin.post(`/admin/returns/${firstId}/inspect`).send({
      lines: [
        {
          productId,
          variantId: variantS,
          size: 'S',
          color: 'Negro',
          restock: 1,
          damage: 0,
        },
      ],
    });
    const overRefund = await admin
      .post(`/admin/returns/${firstId}/close`)
      .send({
        refundAmount: 9999,
      });
    expect(overRefund.status).toBe(400);
    mockMpRefund('refund-guardias');
    const closed = await admin.post(`/admin/returns/${firstId}/close`).send({
      refundAmount: 100,
    });
    expect(closed.status).toBe(201);

    // Fuera de SLA: historial con entrega hace 8 días.
    const old = await makeOrder([item('S', 'Negro', 1)]);
    const oldId = json(old).id as string;
    await deliver(oldId);
    const stored = await prisma.order.findUniqueOrThrow({
      where: { id: oldId },
    });
    const aged = (
      (stored.statusHistory as Array<Record<string, unknown>>) ?? []
    ).map((h) => ({
      ...h,
      at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    await prisma.order.update({
      where: { id: oldId },
      data: { statusHistory: aged },
    });
    const late = await customer.post('/returns').send({
      orderId: oldId,
      items: [
        {
          productId,
          variantId: variantS,
          size: 'S',
          color: 'Negro',
          quantity: 1,
          reason: 'talla',
        },
      ],
    });
    expect(late.status).toBe(400);
  });

  it('RMA: reembolso exige pago MP y no toca la DB si MP falla', async () => {
    const created = await makeOrder([item('S', 'Negro', 1)]);
    const id = json(created).id as string;
    await deliver(id);
    const req = await customer.post('/returns').send({
      orderId: id,
      items: [
        {
          productId,
          variantId: variantS,
          size: 'S',
          color: 'Negro',
          quantity: 1,
          reason: 'talla',
        },
      ],
    });
    const rmaId = json(req).id as string;
    await admin
      .patch(`/admin/returns/${rmaId}/status`)
      .send({ status: 'aprobada' });
    await admin.post(`/admin/returns/${rmaId}/receive`).send({
      lines: [
        {
          productId,
          variantId: variantS,
          size: 'S',
          color: 'Negro',
          quantity: 1,
        },
      ],
    });
    await admin.post(`/admin/returns/${rmaId}/inspect`).send({
      lines: [
        {
          productId,
          variantId: variantS,
          size: 'S',
          color: 'Negro',
          restock: 1,
          damage: 0,
        },
      ],
    });

    // Sin pago MP registrado → 409, nada cambia.
    const noMp = await admin.post(`/admin/returns/${rmaId}/close`).send({
      refundAmount: 100,
    });
    expect(noMp.status).toBe(409);

    // Con pago MP pero MP caído → 502, sigue inspeccionada, sin intento.
    await approveViaMp(id, `reembolso-${stamp}`);
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: false } as Response);
    const failed = await admin.post(`/admin/returns/${rmaId}/close`).send({
      refundAmount: 100,
    });
    expect(failed.status).toBe(502);
    const still = await prisma.returnRequest.findUniqueOrThrow({
      where: { id: rmaId },
    });
    expect(still.status).toBe('inspeccionada');
    expect(
      await prisma.paymentAttempt.count({
        where: { orderId: id, status: 'reembolsado' },
      }),
    ).toBe(0);

    // MP ok → 201 con intento trazado al pago y al refund.
    mockMpRefund('refund-retry');
    const closed = await admin.post(`/admin/returns/${rmaId}/close`).send({
      refundAmount: 100,
    });
    expect(closed.status).toBe(201);
    const attempts = await prisma.paymentAttempt.findMany({
      where: { orderId: id, status: 'reembolsado' },
    });
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.mpPaymentId).toBe(`mp-reembolso-${stamp}`);
  });

  it('admin: lista y detalle de devoluciones', async () => {
    const list = await admin.get('/admin/returns?status=cerrada&limit=10');
    expect(list.status).toBe(200);
    expect(json(list).total as number).toBeGreaterThanOrEqual(2);

    const firstId = (json(list).data as Array<{ id: string }>)[0].id;
    const detail = await admin.get(`/admin/returns/${firstId}`);
    expect(detail.status).toBe(200);
    expect((json(detail).items as unknown[]).length).toBeGreaterThan(0);

    const mine = await customer.get('/returns');
    expect(mine.status).toBe(200);
    expect((mine.body as unknown[]).length).toBeGreaterThanOrEqual(3);
  });
});
