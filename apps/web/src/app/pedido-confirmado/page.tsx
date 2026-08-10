"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Check, Package, MapPin, CreditCard, ArrowRight, Home, ShoppingCart } from "lucide-react";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { formatPrice } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";
import type { Order } from "@/lib/stores/data-store.types";

export default function PedidoConfirmadoPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order] = useState<Order | null>(
    () => orderId ? (ordersStore.getById(orderId) ?? null) : null
  );

  if (!orderId || !order) {
    return (
      <main className="page-root">
        <section className="section-px flex min-h-[60vh] flex-col items-center justify-center text-center">
          <ShoppingCart className="mb-6 size-16 text-muted-foreground" strokeWidth={1} />
          <h1 className="text-2xl font-bold uppercase tracking-tight">
            Pedido no encontrado
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No se pudo encontrar la información de tu pedido.
          </p>
          <Button asChild variant="hero" size="hero" className="mt-8">
            <Link href={ROUTES.catalogo}>
              Ver Catálogo <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  const paymentMethodLabel: Record<string, string> = {
    "yape-plin": "Yape / Plin",
    transferencia: "Transferencia bancaria",
    tarjeta: "Tarjeta",
  };

  return (
    <main className="page-root">
      <section className="section-px pb-20 pt-24 md:pt-28">
        <div className="mx-auto max-w-2xl">
          <PageBreadcrumbs
            className="mb-8"
            items={[
              { label: "Inicio", href: ROUTES.home },
              { label: "Carrito", href: ROUTES.carrito },
              { label: "Pedido confirmado" },
            ]}
          />
          <div className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
              <Check className="size-8 text-success" />
            </div>
            <h1 className="mt-6 text-3xl font-bold uppercase tracking-tight">
              ¡Pedido Confirmado!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Orden #{order.id.slice(0, 8)}
            </p>
          </div>

          <div className="mt-10 space-y-6">
            <div className="rounded-xl border border-border p-6">
              <div className="flex items-center gap-3">
                <Package className="size-5 text-accent" />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Resumen del pedido
                </h2>
              </div>
              <ul className="mt-4 space-y-3 divide-y divide-border">
                {order.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between pt-3 first:pt-0"
                  >
                    <div>
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.size} / {item.color} &times; {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span>
                    {order.shipping === 0
                      ? "GRATIS"
                      : formatPrice(order.shipping)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 text-base font-bold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-6">
              <div className="flex items-center gap-3">
                <MapPin className="size-5 text-accent" />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Dirección de envío
                </h2>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {order.shippingAddressSnapshot.fullName}
                </p>
                <p>{order.shippingAddressSnapshot.street}</p>
                <p>
                  {order.shippingAddressSnapshot.city}, {order.shippingAddressSnapshot.state}
                </p>
                <p>{order.shippingAddressSnapshot.phone}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border p-6">
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-accent" />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Instrucciones de pago
                </h2>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Método:{" "}
                  {paymentMethodLabel["yape-plin"] ?? "Yape / Plin"}
                </p>
                <p className="mt-2">
                  Realiza el pago por Yape o Plin al siguiente número:
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  999 999 999
                </p>
                <p className="mt-3">
                  Una vez realizado el pago, envíanos el comprobante por WhatsApp
                  para confirmar tu pedido.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild variant="hero" size="hero">
              <Link href={ROUTES.catalogo}>
                Seguir comprando <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={ROUTES.home}>
                <Home className="mr-2 size-4" />
                Ir al inicio
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
