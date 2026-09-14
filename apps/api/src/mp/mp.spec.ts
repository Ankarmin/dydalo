import {
  buildManifest,
  parseSignatureHeader,
  verifyWebhookSignature,
} from './mp-signature';
import { buildPreferenceBody, mapMpPaymentStatus } from './mp-mapper';

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
});
