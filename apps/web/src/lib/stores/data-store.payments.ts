import { read, write, generateId, KEYS } from "./data-store.utils";
import type { PaymentAttempt, PaymentStatus } from "./data-store.types";
import { auditStore } from "./data-store.audit";

const PAYMENTS_KEY = (KEYS as Record<string, string>).payments ?? "dydalo_payments";

export const MP_STATUS_DETAIL_LABELS: Record<string, string> = {
  accredited: "Acreditado",
  pending_contingency: "Revisión de contingencia MP",
  pending_review_manual: "Revisión manual MP",
  cc_rejected_insufficient_amount: "Fondos insuficientes",
  cc_rejected_bad_filled_card_number: "Número de tarjeta inválido",
  cc_rejected_bad_filled_date: "Fecha de tarjeta inválida",
  cc_rejected_bad_filled_other: "Datos de tarjeta inválidos",
  cc_rejected_bad_filled_security_code: "Código de seguridad inválido",
  cc_rejected_blacklist: "Tarjeta en lista negra",
  cc_rejected_call_for_authorize: "Debe autorizar con su banco",
  cc_rejected_card_disabled: "Tarjeta deshabilitada",
  cc_rejected_duplicated_payment: "Pago duplicado",
  cc_rejected_high_risk: "Rechazado por riesgo",
  cc_rejected_invalid_installments: "Cuotas inválidas",
  cc_rejected_max_attempts: "Máximo de intentos",
  cc_rejected_other_reason: "Rechazado por MP",
  offline_pending: "Pendiente de pago offline",
};

export function getMpDetailLabel(detail?: string): string {
  if (!detail) return "";
  return MP_STATUS_DETAIL_LABELS[detail] ?? detail.replaceAll("_", " ");
}

export function getFriendlyRejectionMessage(detail?: string): string {
  switch (detail) {
    case "cc_rejected_insufficient_amount":
      return "Fondos insuficientes. Prueba con otra tarjeta o medio de pago.";
    case "cc_rejected_call_for_authorize":
      return "Tu banco debe autorizar el pago. Contáctalo o prueba otra tarjeta.";
    case "cc_rejected_bad_filled_card_number":
    case "cc_rejected_bad_filled_date":
    case "cc_rejected_bad_filled_security_code":
    case "cc_rejected_bad_filled_other":
      return "Revisa los datos de tu tarjeta e inténtalo de nuevo.";
    case "cc_rejected_max_attempts":
      return "Superaste los intentos. Espera unos minutos o usa otro medio.";
    case "cc_rejected_high_risk":
    case "cc_rejected_blacklist":
      return "Pago observado por seguridad. Prueba otro medio o contáctanos.";
    default:
      return "Tu pago fue rechazado. Puedes reintentarlo o te ayudamos por WhatsApp.";
  }
}

export function buildRetryLink(orderId: string, attemptNumber: number): string {
  return `/checkout/reintentar?order=${orderId}&intento=${attemptNumber}`;
}

export function buildHelpWhatsAppMessage(orderLabel: string, reason: string, retryLink: string): string {
  return `Hola, tu pedido ${orderLabel} fue observado por ${reason}. Puedes reintentar aquí: ${retryLink} o te ayudo por aquí. — DYDALO`;
}

function getAllAttempts(): PaymentAttempt[] {
  return read<PaymentAttempt[]>(PAYMENTS_KEY, []);
}

function getByOrderId(orderId: string): PaymentAttempt[] {
  return getAllAttempts()
    .filter((a) => a.orderId === orderId)
    .toSorted((a, b) => a.attemptNumber - b.attemptNumber);
}

function nextAttemptNumber(orderId: string): number {
  const attempts = getByOrderId(orderId);
  return attempts.length === 0 ? 1 : Math.max(...attempts.map((a) => a.attemptNumber)) + 1;
}

function createAttempt(input: {
  orderId: string;
  status: PaymentStatus;
  amount: number;
  method?: string;
  mpPaymentId?: string;
  mpStatusDetail?: string;
  reason?: string;
  evidence?: string;
  actorId: string;
  actorName: string;
}): PaymentAttempt {
  const now = new Date().toISOString();
  const attempt: PaymentAttempt = {
    id: generateId(),
    orderId: input.orderId,
    attemptNumber: nextAttemptNumber(input.orderId),
    status: input.status,
    amount: input.amount,
    method: input.method,
    mpPaymentId: input.mpPaymentId,
    mpStatusDetail: input.mpStatusDetail,
    reason: input.reason,
    evidence: input.evidence,
    actorId: input.actorId,
    actorName: input.actorName,
    createdAt: now,
    updatedAt: now,
  };
  write(PAYMENTS_KEY, [...getAllAttempts(), attempt]);
  auditStore.create({
    actor: { id: input.actorId, name: input.actorName },
    entityType: "order",
    entityId: input.orderId,
    entityLabel: `#${input.orderId.slice(0, 8)}`,
    action: "status_change",
    summary: `Pago intento ${attempt.attemptNumber}: ${input.status}${input.reason ? ` — ${input.reason}` : ""}`,
    before: undefined,
    after: { paymentStatus: input.status, attemptNumber: attempt.attemptNumber },
    changes: [{ field: "paymentStatus", before: "previo", after: input.status }],
  });
  return attempt;
}

function isStuckInReview(orderId: string, hours = 24): boolean {
  const attempts = getByOrderId(orderId);
  const last = attempts[attempts.length - 1];
  if (!last) return false;
  if (last.status !== "in_process" && last.status !== "en_revision") return false;
  const ageMs = Date.now() - new Date(last.updatedAt).getTime();
  return ageMs > hours * 60 * 60 * 1000;
}

function lastRejectedWithoutRetry(orderId: string, hours = 2): boolean {
  const attempts = getByOrderId(orderId);
  const last = attempts[attempts.length - 1];
  if (!last || last.status !== "rechazado") return false;
  const ageMs = Date.now() - new Date(last.updatedAt).getTime();
  return ageMs > hours * 60 * 60 * 1000;
}

const KNOWN_PAYMENT_STATUSES: ReadonlySet<string> = new Set([
  "sin_registro",
  "pendiente",
  "in_process",
  "aprobado",
  "rechazado",
  "cancelado",
  "reembolsado",
  "en_revision",
  "verificado_manual",
  "en_disputa",
  "contracargo",
  "pagado",
]);

function ensureBackfillForOrders(orders: Array<{ id: string; total: number; paymentMethod?: string; paymentStatus?: unknown; createdBy?: string }>): void {
  for (const order of orders) {
    if (getByOrderId(order.id).length > 0) continue;
    const raw = typeof order.paymentStatus === "string" ? order.paymentStatus : "sin_registro";
    const normalized = raw === "pagado" ? "aprobado" : raw;
    const status = (KNOWN_PAYMENT_STATUSES.has(normalized) ? normalized : "sin_registro") as PaymentStatus;
    if (status === "sin_registro") continue;
    createAttempt({
      orderId: order.id,
      status,
      amount: order.total,
      method: order.paymentMethod,
      reason: "Migración B-01: intento inicial reconstruido",
      actorId: order.createdBy ?? "sistema",
      actorName: order.createdBy ?? "Sistema",
    });
  }
}

export const paymentsStore = {
  getByOrderId,
  createAttempt,
  ensureBackfillForOrders,
  isStuckInReview,
  lastRejectedWithoutRetry,
  getMpDetailLabel,
  getFriendlyRejectionMessage,
  buildRetryLink,
  buildHelpWhatsAppMessage,
};
