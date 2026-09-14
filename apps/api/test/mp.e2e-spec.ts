// E2E Fase 7: preferencia MP (mock sin token) + webhook firmado.
// Sin credenciales reales: firma 401, config ausente 503, mock 200.
import { createHmac } from 'crypto';
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

const prisma = new PrismaClient();
const stamp = Date.now();
const customerEmail = `mp-e2e+${stamp}@dydalo.test`;
const WEBHOOK_SECRET = 'e2e-webhook-secret'; // ver test/setup-e2e.ts

function sign(dataId: string, requestId: string, ts: string): string {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac('sha256', WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex');
  return `ts=${ts},v1=${v1}`;
}

const snapshot = {
  label: 'Casa',
  fullName: 'Mp E2e',
  street: 'Av. Prueba 123',
  district: 'Miraflores',
  city: 'Lima',
  state: 'Lima',
  phone: '999888777',
};

describe('MercadoPago (e2e)', () => {
  let app: Awaited<ReturnType<TestingModule['createNestApplication']>>;
  let customer: request.Agent;
  let orderId = '';

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

    customer = request.agent(app.getHttpServer() as App);
    const register = await customer.post('/auth/register').send({
      firstName: 'Mp',
      lastName: 'E2e',
      email: customerEmail,
      phone: '999888777',
      password: 'E2eTest123',
    });
    expect(register.status).toBe(201);

    const variant = await prisma.productVariant.findFirstOrThrow({
      where: { product: { slug: '1-heavy-cotton-polo' }, stock: { gte: 2 } },
      include: { product: true },
    });
    const created = await customer.post('/orders').send({
      items: [
        {
          productId: variant.productId,
          size: variant.size,
          color: variant.color,
          quantity: 1,
        },
      ],
      shippingAddress: snapshot,
    });
    expect(created.status).toBe(201);
    orderId = (created.body as { id: string }).id;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { id: orderId } });
    await prisma.stockMovement.deleteMany({
      where: { orderId },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'mp-e2e+' } },
    });
    await prisma.$disconnect();
    await app.close();
  });

  it('GET /payments/webhook responde (verificación de MP)', async () => {
    const res = await anon().get('/payments/webhook');
    expect(res.status).toBe(200);
  });

  it('webhook sin tipo payment se ignora con 200', async () => {
    const res = await anon().post('/payments/webhook?type=merchant_order');
    expect(res.status).toBe(200);
    expect((res.body as { ignored: boolean }).ignored).toBe(true);
  });

  it('webhook payment con firma inválida → 401', async () => {
    const res = await anon()
      .post('/payments/webhook?type=payment&data.id=123')
      .set('x-signature', 'ts=1,v1=mala')
      .set('x-request-id', 'req-1');
    expect(res.status).toBe(401);
  });

  it('webhook con firma válida supera verificación y consulta MP (token fake → 502)', async () => {
    // El 401 queda descartado: la firma es válida. El 503 sin token se
    // cubre en unit (mp.spec.ts); aquí el token fake falla en MP real.
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await anon()
      .post('/payments/webhook?type=payment&data.id=999999')
      .set('x-signature', sign('999999', 'req-e2e', ts))
      .set('x-request-id', 'req-e2e');
    expect(res.status).toBe(502);
  });

  it('preferencia con token fake (fetch mockeado) → initPoint sandbox', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'pref-e2e-1',
          init_point: 'https://www.mercadopago.com/pay',
          sandbox_init_point: 'https://sandbox.mercadopago.com/pay',
        }),
    } as Response);
    try {
      const res = await customer.post(`/orders/${orderId}/mp-preference`);
      expect(res.status).toBe(201);
      const body = res.body as {
        initPoint: string;
        sandbox: boolean;
        preferenceId: string;
      };
      expect(body.initPoint).toBe('https://sandbox.mercadopago.com/pay');
      expect(body.sandbox).toBe(true);
      expect(body.preferenceId).toBe('pref-e2e-1');
    } finally {
      spy.mockRestore();
    }

    const missing = await customer.post('/orders/no-existe/mp-preference');
    expect(missing.status).toBe(404);
  });

  describe('mp-sync (fetch mockeado: sin red real)', () => {
    const mpPayment = {
      id: 777888999,
      status: 'approved',
      status_detail: 'accredited',
      external_reference: '',
      transaction_amount: 100,
    };

    function mockSearch(results: Array<Record<string, unknown>>) {
      return jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results }),
      } as Response);
    }

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('pedido ajeno → 404 sin llamar a MP', async () => {
      const spy = jest.spyOn(globalThis, 'fetch');
      const res = await customer.post('/orders/no-existe/mp-sync');
      expect(res.status).toBe(404);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('aplica el último pago y es idempotente', async () => {
      mpPayment.external_reference = orderId;
      const spy = mockSearch([{ ...mpPayment }]);

      const first = await customer.post(`/orders/${orderId}/mp-sync`);
      expect(first.status).toBe(201);
      expect((first.body as { synced: boolean }).synced).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);

      const detail = await customer.get(`/orders/${orderId}`);
      expect((detail.body as { paymentStatus: string }).paymentStatus).toBe(
        'aprobado',
      );

      const second = await customer.post(`/orders/${orderId}/mp-sync`);
      expect((second.body as { duplicate?: boolean }).duplicate).toBe(true);

      const attempts = await prisma.paymentAttempt.findMany({
        where: { orderId, mpPaymentId: '777888999' },
      });
      expect(attempts).toHaveLength(1);
    });

    it('sin pagos en MP → synced:false', async () => {
      mockSearch([]);
      const res = await customer.post(`/orders/${orderId}/mp-sync`);
      expect(res.status).toBe(201);
      expect((res.body as { synced: boolean }).synced).toBe(false);
    });
  });
});
