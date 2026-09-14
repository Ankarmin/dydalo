import type { ConfigService } from '@nestjs/config';
import {
  buildManifest,
  parseSignatureHeader,
  verifyWebhookSignature,
} from './mp-signature';
import { buildPreferenceBody, mapMpPaymentStatus } from './mp-mapper';
import { MpService } from './mp.service';

describe('mp-signature', () => {
  // Vector precomputado independiente (node:crypto directo):
  // manifest `id:123456;request-id:req-1;ts:1704908010;`, secret `test-secret`.
  const ts = '1704908010';
  const v1 = 'fe601d434b9782c32a2863aec99718a9263c4300835e75d990041d9b7cbfaebe';
  const header = `ts=${ts},v1=${v1}`;

  it('parsea ts y v1 del header', () => {
    expect(parseSignatureHeader(header)).toEqual({ ts, v1 });
    expect(parseSignatureHeader(undefined)).toEqual({});
    expect(parseSignatureHeader('basura')).toEqual({});
  });

  it('construye el manifest oficial', () => {
    expect(buildManifest('123456', 'req-1', ts)).toBe(
      'id:123456;request-id:req-1;ts:1704908010;',
    );
  });

  it('acepta firma válida', () => {
    expect(
      verifyWebhookSignature({
        xSignature: header,
        xRequestId: 'req-1',
        dataId: '123456',
        secret: 'test-secret',
      }),
    ).toBe(true);
  });

  it('rechaza firma adulterada, incompleta o sin secreto', () => {
    const base = {
      xSignature: header,
      xRequestId: 'req-1',
      dataId: '123456',
      secret: 'test-secret',
    };
    expect(
      verifyWebhookSignature({
        ...base,
        xSignature: `ts=${ts},v1=00${v1.slice(2)}`,
      }),
    ).toBe(false);
    expect(verifyWebhookSignature({ ...base, dataId: '999' })).toBe(false);
    expect(verifyWebhookSignature({ ...base, secret: '' })).toBe(false);
    expect(verifyWebhookSignature({ ...base, xSignature: undefined })).toBe(
      false,
    );
  });
});

describe('mp-mapper', () => {
  it('mapea los 9 estados MP a los internos', () => {
    expect(mapMpPaymentStatus('approved')).toBe('aprobado');
    expect(mapMpPaymentStatus('pending')).toBe('pendiente');
    expect(mapMpPaymentStatus('authorized')).toBe('in_process');
    expect(mapMpPaymentStatus('in_process')).toBe('in_process');
    expect(mapMpPaymentStatus('in_mediation')).toBe('en_disputa');
    expect(mapMpPaymentStatus('rejected')).toBe('rechazado');
    expect(mapMpPaymentStatus('cancelled')).toBe('cancelado');
    expect(mapMpPaymentStatus('refunded')).toBe('reembolsado');
    expect(mapMpPaymentStatus('charged_back')).toBe('contracargo');
    expect(mapMpPaymentStatus('weird_future_status')).toBeNull();
  });

  it('arma el body de preferencia (binary_mode false, PEN, back_urls)', () => {
    const body = buildPreferenceBody({
      orderId: 'order-1',
      orderLabel: 'order-1',
      payerEmail: 'a@b.com',
      items: [{ id: 'p1', title: 'Polo S/Negro', quantity: 2, unitPrice: 89 }],
      frontendUrl: 'https://tienda.test',
      notificationUrl: 'https://api.test/payments/webhook',
      autoReturn: true,
    });
    expect(body.binary_mode).toBe(false);
    expect(body.external_reference).toBe('order-1');
    expect(body.notification_url).toBe('https://api.test/payments/webhook');
    expect(body.back_urls.success).toContain('order=order-1');
    expect(body.auto_return).toBe('approved');
    expect(body.items).toEqual([
      {
        id: 'p1',
        title: 'Polo S/Negro',
        quantity: 2,
        unit_price: 89,
        currency_id: 'PEN',
      },
    ]);
  });

  it('omite auto_return con URLs locales (MP lo rechaza)', () => {
    const body = buildPreferenceBody({
      orderId: 'order-1',
      orderLabel: 'order-1',
      items: [{ id: 'p1', title: 'Polo', quantity: 1, unitPrice: 10 }],
      frontendUrl: 'http://localhost:3000',
      notificationUrl: 'http://localhost:3001/payments/webhook',
    });
    expect('auto_return' in body).toBe(false);
  });
});

describe('mp sin credenciales (modo mock)', () => {
  const stubConfig = (values: Record<string, string>) =>
    ({
      get: (key: string) => values[key] ?? '',
    }) as unknown as ConfigService;

  const pendingOrder = {
    id: 'order-1',
    status: 'pendiente',
    paymentStatus: 'pendiente',
    userId: 'user-1',
    items: [],
  };

  function serviceWithoutToken() {
    return new MpService(
      stubConfig({}),
      {
        findById: (id: string) =>
          Promise.resolve(id === 'order-1' ? pendingOrder : null),
      } as never,
      {} as never,
    );
  }

  it('preferencia sin token → mock:true sin salir a red', async () => {
    const spy = jest.spyOn(globalThis, 'fetch');
    const svc = serviceWithoutToken();
    await expect(
      svc.createPreferenceForOrder('order-1', {
        id: 'user-1',
        role: 'customer',
      }),
    ).resolves.toEqual({ mock: true });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('webhook con firma válida pero sin token → 503', async () => {
    const ts = '1704908010';
    const v1 =
      'fe601d434b9782c32a2863aec99718a9263c4300835e75d990041d9b7cbfaebe';
    // Mismo secret que valida el stub.
    const svcWithSecret = new MpService(
      stubConfig({ MP_WEBHOOK_SECRET: 'test-secret' }),
      {
        findById: () => Promise.resolve(pendingOrder),
      } as never,
      {} as never,
    );
    await expect(
      svcWithSecret.handleWebhook({
        type: 'payment',
        dataId: '123456',
        xSignature: `ts=${ts},v1=${v1}`,
        xRequestId: 'req-1',
      }),
    ).rejects.toMatchObject({ status: 503 });
  });

  it('sync sin token → 503 sin salir a red', async () => {
    const spy = jest.spyOn(globalThis, 'fetch');
    const svc = serviceWithoutToken();
    await expect(
      svc.syncOrderPayment('order-1', { id: 'user-1', role: 'customer' }),
    ).rejects.toMatchObject({ status: 503 });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
