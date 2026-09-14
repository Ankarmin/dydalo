import { createHmac, timingSafeEqual } from 'crypto';

// Verificación de firma de webhooks MP (esquema oficial):
// manifest = `id:{data.id};request-id:{x-request-id};ts:{ts};`
// (se omiten segmentos vacíos salvo `ts`), HMAC-SHA256 con el secret,
// comparar contra `v1` del header `x-signature: t=...,v1=...`.
// Falla cerrado: sin ts/v1/secret → false (el controller responde 401).
export function parseSignatureHeader(header?: string): {
  ts?: string;
  v1?: string;
} {
  if (!header) return {};
  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of header.split(',')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === 'ts' && value) ts = value;
    if (key === 'v1' && value) v1 = value;
  }
  return { ts, v1 };
}

export function buildManifest(
  dataId: string,
  requestId: string,
  ts: string,
): string {
  const parts: string[] = [];
  if (dataId) parts.push(`id:${dataId.toLowerCase()}`);
  if (requestId) parts.push(`request-id:${requestId}`);
  parts.push(`ts:${ts}`);
  return `${parts.join(';')};`;
}

export function verifyWebhookSignature(input: {
  xSignature?: string;
  xRequestId?: string;
  dataId?: string;
  secret?: string;
}): boolean {
  const { ts, v1 } = parseSignatureHeader(input.xSignature);
  if (!ts || !v1 || !input.secret) return false;
  const manifest = buildManifest(
    input.dataId ?? '',
    input.xRequestId ?? '',
    ts,
  );
  const computed = createHmac('sha256', input.secret)
    .update(manifest)
    .digest('hex');
  if (computed.length !== v1.length) return false;
  return timingSafeEqual(Buffer.from(computed), Buffer.from(v1));
}
