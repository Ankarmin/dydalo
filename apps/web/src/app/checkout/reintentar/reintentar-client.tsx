"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreditCard, ArrowRight, Home } from "lucide-react";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { paymentsStore } from "@/lib/stores/data-store.payments";
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils/format";

export function ReintentarPagoClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order") ?? "";
  const [order, setOrder] = useState(() => (orderId ? ordersStore.getById(orderId) : undefined));
  const [processing, setProcessing] = useState(false);

  const attempts = useMemo(() => (order ? paymentsStore.getByOrderId(order.id) : []), [order]);
  const last = attempts[attempts.length - 1];
  const paymentStatus = (order && PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus]
    ? (order.paymentStatus as PaymentStatus)
    : "sin_registro") as PaymentStatus;

  if (!orderId || !order) {
    return (
      <main className="page-root">
        <section className="section-px flex min-h-[60vh] flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-bold uppercase tracking-tight">Pedido no encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">El enlace de reintento no es válido.</p>
          <Button asChild variant="hero" size="hero" className="mt-8">
            <Link href={ROUTES.catalogo}>Ver Catálogo</Link>
          </Button>
        </section>
      </main>
    );
  }

  function simulate(result: "aprobado" | "rechazado") {
    const current = ordersStore.getById(orderId);
    if (processing || !current) return;
    setProcessing(true);
    window.setTimeout(() => {
      const updated = ordersStore.updatePaymentStatus(current.id, {
        status: result,
        method: current.paymentMethod ?? "Tarjeta MP",
        mpPaymentId: result === "aprobado" ? `MP-${Date.now().toString().slice(-8)}` : undefined,
        mpStatusDetail: result === "aprobado" ? "accredited" : "cc_rejected_insufficient_amount",
        reason: result === "aprobado" ? `Reintento ${attempts.length + 1} aprobado (mock)` : `Reintento ${attempts.length + 1} rechazado (mock)`,
        actorId: "sistema_mp",
        actorName: "MercadoPago",
      });
      setProcessing(false);
      if (updated) setOrder(updated);
    }, 900);
  }

  return (
    <main className="page-root">
      <section className="section-px pb-20 pt-24 md:pt-28">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-info/10">
              <CreditCard className="size-8 text-info" />
            </div>
            <h1 className="mt-6 text-3xl font-bold uppercase tracking-tight">Reintentar pago</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pedido #{order.id.slice(0, 8)} · {formatPrice(order.total)} · {PAYMENT_STATUS_LABELS[paymentStatus]}
            </p>
          </div>

          <div className="mt-10 rounded-xl border border-border p-6">
            {paymentStatus === "aprobado" || paymentStatus === "verificado_manual" ? (
              <div className="text-center">
                <p className="text-sm font-medium">Tu pago ya está confirmado. ¡Gracias por tu compra!</p>
                <Button asChild variant="hero" size="hero" className="mt-6">
                  <Link href={`${ROUTES.pedidoConfirmado}?orderId=${order.id}`}>
                    Ver mi pedido <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            ) : paymentStatus === "cancelado" ? (
              <div className="text-center">
                <p className="text-sm font-medium">Este pedido expiró y el stock fue liberado.</p>
                <p className="mt-2 text-sm text-muted-foreground">Haz un nuevo pedido desde el catálogo.</p>
                <Button asChild variant="hero" size="hero" className="mt-6">
                  <Link href={ROUTES.catalogo}>Ver Catálogo</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center">
                {paymentStatus === "rechazado" && (
                  <p className="mb-4 text-sm text-muted-foreground">
                    {paymentsStore.getFriendlyRejectionMessage(last?.mpStatusDetail)}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Intento N° {attempts.length + 1} vía MercadoPago (mock).</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button variant="hero" size="hero" disabled={processing} onClick={() => simulate("aprobado")}>
                    {processing ? "Procesando..." : "Pagar ahora"}
                  </Button>
                  <Button variant="outline" size="lg" disabled={processing} onClick={() => simulate("rechazado")}>
                    Simular rechazo
                  </Button>
                </div>
                <Button asChild variant="ghost" size="sm" className="mt-4">
                  <Link href={ROUTES.home}>
                    <Home className="mr-2 size-4" /> Ir al inicio
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
