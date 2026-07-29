"use client";

import { toast } from "sonner";
import { CheckCircle, X } from "lucide-react";
import { TOAST_DURATION_MS, TOAST_CLOSE_LABEL } from "@/config/constants";
import { formatPrice } from "@/lib/utils/format";

export function showOrderConfirmedToast(orderId: string, total: number) {
  toast.custom(
    (t) => (
      <div
        onClick={(e) => { e.stopPropagation(); toast.dismiss(t); }}
        className="group pointer-events-auto relative flex items-center gap-4 border border-border bg-background px-5 py-4 shadow-lg animate-in slide-in-from-right-full duration-500 cursor-pointer"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-success" />

        <div className="relative flex size-10 shrink-0 items-center justify-center border border-success bg-success/10">
          <CheckCircle className="size-4 text-success" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="section-tag">pedido confirmado</p>
          <p className="mt-0.5 truncate text-xs font-bold uppercase tracking-wider text-foreground">
            Orden #{orderId.slice(0, 8)}
          </p>
          <p className="mt-1 micro-text font-bold tracking-micro text-muted-foreground">
            {formatPrice(total)}
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); toast.dismiss(t); }}
          aria-label={TOAST_CLOSE_LABEL}
          className="shrink-0 p-2 text-muted-foreground transition-colors hover:text-foreground focus-ring"
        >
          <X className="size-3.5" />
        </button>

        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-success origin-left animate-shimmer" />
      </div>
    ),
    {
      duration: TOAST_DURATION_MS,
      position: "bottom-right",
    }
  );
}
