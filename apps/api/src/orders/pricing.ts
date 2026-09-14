import { FulfillmentType } from '@prisma/client';
import { computeCouponDiscount } from '../coupons/coupons.service';

// Matemática del checkout, paridad con el frontend:
// - precio unitario = precio con descuento de producto aplicado.
// - envío: Olva S/15, resto 0 (precio manual por pedido = Fase 6).
// - total = subtotal + envío − cupón.
export function unitFinalPrice(
  price: number,
  discount?: number | null,
): number {
  const d = discount ?? 0;
  return d > 0 ? price * (1 - d / 100) : price;
}

export const OLVA_BASE_SHIPPING = 15;

export function shippingFor(fulfillment: FulfillmentType): number {
  return fulfillment === 'PROVINCIA_OLVA' ? OLVA_BASE_SHIPPING : 0;
}

export function couponDiscountFor(
  type: Parameters<typeof computeCouponDiscount>[0],
  value: number,
  subtotal: number,
): number {
  return computeCouponDiscount(type, value, subtotal);
}

// TTL de reserva temporal (Modelo A del backlog): 24h online / 48h manual.
export function reservationExpiry(
  origin: 'mp_online' | 'manual',
  from: Date = new Date(),
): Date {
  const hours = origin === 'manual' ? 48 : 24;
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}
