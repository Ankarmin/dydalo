import type { PaymentStatus } from '@prisma/client';

// Mapeo estado de pago MP → estado interno (11 estados del backlog).
// `binary_mode: false` (decisión vigente): se ven todos los estados,
// por eso el mapa cubre intermedios y no solo aprobado/rechazado.
const MP_PAYMENT_STATUS_MAP: Record<string, PaymentStatus> = {
  approved: 'aprobado',
  pending: 'pendiente',
  authorized: 'in_process',
  in_process: 'in_process',
  in_mediation: 'en_disputa',
  rejected: 'rechazado',
  cancelled: 'cancelado',
  refunded: 'reembolsado',
  charged_back: 'contracargo',
};

export function mapMpPaymentStatus(mpStatus: string): PaymentStatus | null {
  return MP_PAYMENT_STATUS_MAP[mpStatus.trim().toLowerCase()] ?? null;
}

export type MpPayment = {
  id: string;
  status: string;
  statusDetail?: string;
  externalReference?: string;
  transactionAmount?: number;
};

export type MpPreferenceInput = {
  orderId: string;
  orderLabel: string;
  payerEmail?: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unitPrice: number;
  }>;
  frontendUrl: string;
  notificationUrl: string;
  // MP rechaza `auto_return: approved` con back_urls localhost, así que
  // solo se manda con URLs públicas (https). En local el retorno se
  // concilia vía webhook (túnel) o mp-sync.
  autoReturn?: boolean;
};

// Constructor puro del body de preferencia (testeable sin red).
export function buildPreferenceBody(input: MpPreferenceInput) {
  const confirmBase = `${input.frontendUrl.replace(/\/$/, '')}/pedido-confirmado?order=${input.orderId}`;
  return {
    items: input.items.map((i) => ({
      id: i.id,
      title: i.title,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      currency_id: 'PEN',
    })),
    payer: input.payerEmail ? { email: input.payerEmail } : undefined,
    back_urls: {
      success: `${confirmBase}&mp=success`,
      failure: `${confirmBase}&mp=failure`,
      pending: `${confirmBase}&mp=pending`,
    },
    ...(input.autoReturn ? { auto_return: 'approved' as const } : {}),
    external_reference: input.orderId,
    notification_url: input.notificationUrl,
    binary_mode: false,
    statement_descriptor: 'DYDALO',
  };
}
