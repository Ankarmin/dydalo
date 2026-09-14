// Pedidos, pagos, cupones y devoluciones contra el backend (Fase 7).
import { apiFetch } from "./client";
import type {
  Address,
  FulfillmentType,
  Order,
  PaymentAttempt,
  PaymentStatus,
  ReturnReason,
  ReturnRequest,
} from "@/lib/stores/data-store.types";

export function mapApiOrder(o: Record<string, unknown>): Order {
  return o as unknown as Order;
}

export type ApiCheckoutItem = {
  productId: string;
  variantId?: string;
  size: string;
  color: string;
  quantity: number;
};

export type ApiCheckoutInput = {
  items: ApiCheckoutItem[];
  fulfillmentType?: FulfillmentType;
  couponCode?: string;
  paymentMethod?: string;
  shippingAddressId?: string;
  shippingAddress: Address;
};

export async function apiCreateOrder(input: ApiCheckoutInput): Promise<Order> {
  const order = await apiFetch<Record<string, unknown>>("/orders", {
    method: "POST",
    body: input,
  });
  return mapApiOrder(order);
}

export async function apiValidateCoupon(
  code: string,
  subtotal: number,
): Promise<{ valid: boolean; discount?: number; error?: string }> {
  const res = await apiFetch<{ valid: boolean; discount?: number; error?: string }>(
    "/coupons/validate",
    { method: "POST", body: { code, subtotal } },
  );
  return res;
}

export async function apiMyOrders(): Promise<Order[]> {
  const page = await apiFetch<{ data: Record<string, unknown>[] }>("/orders");
  return page.data.map(mapApiOrder);
}

export async function apiGetOrder(id: string): Promise<Order> {
  return mapApiOrder(await apiFetch<Record<string, unknown>>(`/orders/${id}`));
}

export async function apiGetAttempts(orderId: string): Promise<PaymentAttempt[]> {
  return apiFetch<PaymentAttempt[]>(`/orders/${orderId}/attempts`);
}

export async function apiRetryOrder(orderId: string): Promise<unknown> {
  return apiFetch(`/orders/${orderId}/retry`, { method: "POST" });
}

export async function apiCancelOrder(orderId: string): Promise<Order> {
  return mapApiOrder(
    await apiFetch<Record<string, unknown>>(`/orders/${orderId}/cancel`, {
      method: "PATCH",
    }),
  );
}

export type MpPreferenceResult =
  | { mock: true }
  | { mock: false; initPoint: string; preferenceId: string; sandbox: boolean };

export async function apiMpPreference(orderId: string): Promise<MpPreferenceResult> {
  return apiFetch<MpPreferenceResult>(`/orders/${orderId}/mp-preference`, {
    method: "POST",
  });
}

export async function apiMyReturns(): Promise<ReturnRequest[]> {
  return apiFetch<ReturnRequest[]>("/returns");
}

export async function apiCreateReturn(input: {
  orderId: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    reason: ReturnReason;
    reasonNote?: string;
  }>;
}): Promise<{ success: boolean; data?: ReturnRequest; error?: string }> {
  try {
    const data = await apiFetch<ReturnRequest>("/returns", {
      method: "POST",
      body: input,
    });
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudo crear la devolución",
    };
  }
}

export function apiRetryLink(orderId: string, attemptNumber: number): string {
  return `/checkout/reintentar?order=${orderId}&intento=${attemptNumber}`;
}

export type { PaymentStatus };
