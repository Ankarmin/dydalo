import { read, write, generateId, KEYS } from "./data-store.utils";
import type { Coupon, CouponType } from "./data-store.types";
import { computeCouponDiscount } from "./data-store.types";
import { auditStore } from "./data-store.audit";

const COUPONS_KEY = (KEYS as Record<string, string>).coupons ?? "dydalo_coupons";

export type CouponValidation =
  | { valid: true; coupon: Coupon; discount: number }
  | { valid: false; error: string };

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function getAll(): Coupon[] {
  return read<Coupon[]>(COUPONS_KEY, []);
}

function getById(id: string): Coupon | undefined {
  return getAll().find((c) => c.id === id);
}

function getByCode(code: string): Coupon | undefined {
  const normalized = normalizeCode(code);
  return getAll().find((c) => c.code === normalized);
}

function validate(
  code: string,
  input: { userId: string; email: string; subtotal: number; now?: Date }
): CouponValidation {
  const coupon = getByCode(code);
  if (!coupon) return { valid: false, error: "Cupón no válido." };
  if (!coupon.active) return { valid: false, error: "Cupón desactivado." };
  const now = input.now ?? new Date();
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now.getTime()) {
    return { valid: false, error: "Cupón aún no vigente." };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= now.getTime()) {
    return { valid: false, error: "Cupón vencido." };
  }
  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: "Cupón agotado." };
  }
  if (coupon.usedBy.includes(input.userId)) {
    return { valid: false, error: "Ya usaste este cupón." };
  }
  const email = input.email.trim().toLowerCase();
  if (email && coupon.usedEmails.includes(email)) {
    return { valid: false, error: "Ya usaste este cupón." };
  }
  if (coupon.minSubtotal !== undefined && input.subtotal < coupon.minSubtotal) {
    return { valid: false, error: `Requiere compra mínima de S/${coupon.minSubtotal}.` };
  }
  return { valid: true, coupon, discount: computeCouponDiscount(coupon, input.subtotal) };
}

function create(data: {
  code: string;
  type: CouponType;
  value: number;
  minSubtotal?: number;
  maxUses?: number;
  startsAt?: string;
  expiresAt?: string;
  actorId: string;
  actorName: string;
}): Coupon | undefined {
  const code = normalizeCode(data.code);
  if (!code || data.value <= 0 || getByCode(code)) return undefined;
  if (data.type === "PERCENT" && data.value > 100) return undefined;
  const now = new Date().toISOString();
  const coupon: Coupon = {
    id: generateId(),
    code,
    type: data.type,
    value: data.value,
    minSubtotal: data.minSubtotal,
    maxUses: data.maxUses,
    usedCount: 0,
    usedBy: [],
    usedEmails: [],
    startsAt: data.startsAt || undefined,
    expiresAt: data.expiresAt || undefined,
    active: true,
    createdBy: data.actorId,
    createdByName: data.actorName,
    createdAt: now,
    updatedAt: now,
  };
  write(COUPONS_KEY, [coupon, ...getAll()]);
  auditStore.create({
    actor: { id: data.actorId, name: data.actorName },
    entityType: "discount",
    entityId: coupon.id,
    entityLabel: coupon.code,
    action: "create",
    summary: `Creó cupón ${coupon.code}`,
    after: coupon,
  });
  return coupon;
}

function update(
  id: string,
  data: Partial<Pick<Coupon, "type" | "value" | "minSubtotal" | "maxUses" | "startsAt" | "expiresAt" | "active">> & {
    actorId: string;
    actorName: string;
  }
): Coupon | undefined {
  const coupons = getAll();
  const index = coupons.findIndex((c) => c.id === id);
  if (index === -1) return undefined;
  if (data.value !== undefined && data.value <= 0) return undefined;
  if (data.type === "PERCENT" && data.value !== undefined && data.value > 100) return undefined;
  const { actorId, actorName, ...changes } = data;
  const before = coupons[index];
  const updated: Coupon = { ...before, ...changes, updatedAt: new Date().toISOString() };
  const next = [...coupons];
  next[index] = updated;
  write(COUPONS_KEY, next);
  auditStore.create({
    actor: { id: actorId, name: actorName },
    entityType: "discount",
    entityId: id,
    entityLabel: updated.code,
    action: "discount_change",
    summary: `Editó cupón ${updated.code}`,
    before,
    after: updated,
  });
  return updated;
}

function registerUse(id: string, input: { userId: string; email: string; orderId: string }): boolean {
  const coupons = getAll();
  const index = coupons.findIndex((c) => c.id === id);
  if (index === -1) return false;
  const coupon = coupons[index];
  if (coupon.usedBy.includes(input.userId)) return false;
  const email = input.email.trim().toLowerCase();
  const updated: Coupon = {
    ...coupon,
    usedCount: coupon.usedCount + 1,
    usedBy: [...coupon.usedBy, input.userId],
    usedEmails: email ? [...coupon.usedEmails, email] : coupon.usedEmails,
    updatedAt: new Date().toISOString(),
  };
  const next = [...coupons];
  next[index] = updated;
  write(COUPONS_KEY, next);
  auditStore.create({
    actor: { id: input.userId, name: email || input.userId },
    entityType: "discount",
    entityId: id,
    entityLabel: coupon.code,
    action: "discount_change",
    summary: `Usó cupón ${coupon.code} en pedido #${input.orderId.slice(0, 8)}`,
    before: { usedCount: coupon.usedCount },
    after: { usedCount: updated.usedCount },
    changes: [{ field: "usedCount", before: coupon.usedCount, after: updated.usedCount }],
  });
  return true;
}

export const couponsStore = {
  getAll,
  getById,
  getByCode,
  normalizeCode,
  validate,
  create,
  update,
  registerUse,
};
