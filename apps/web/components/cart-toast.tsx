'use client';

import { toast } from 'sonner';
import { ShoppingBag, X } from 'lucide-react';
import { TOAST_DURATION_MS } from '@/lib/constants';
import { formatPrice } from '@/lib/format';

export function showCartToast(productName: string, price: number) {
  toast.custom(
    (t) => (
      <div
        data-toast-notification
        onClick={(e) => { e.stopPropagation(); toast.dismiss(t); }}
        className="group pointer-events-auto relative flex items-center gap-4 border border-border bg-background px-5 py-4 shadow-lg animate-in slide-in-from-right-full duration-500 cursor-pointer"
      >
        {/* Accent stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />

        {/* Icon */}
        <div className="relative flex size-10 shrink-0 items-center justify-center border border-accent bg-accent/10">
          <ShoppingBag className="size-4 text-accent" />
          <span className="absolute -right-1 -top-1 size-3 animate-pulse bg-accent" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="overline">agregado a la bolsa</p>
          <p className="mt-0.5 truncate text-xs font-bold uppercase tracking-wider text-foreground">
            {productName}
          </p>
          <p className="mt-1 micro-text font-bold tracking-micro text-muted-foreground">
            {formatPrice(price)}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={(e) => { e.stopPropagation(); toast.dismiss(t); }}
          aria-label="Cerrar notificación"
          className="shrink-0 p-2 text-muted-foreground transition-colors hover:text-foreground focus-ring"
        >
          <X className="size-3.5" />
        </button>

        {/* Bottom accent line animation */}
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-accent origin-left animate-shimmer" />
      </div>
    ),
    {
      duration: TOAST_DURATION_MS,
      position: 'bottom-right',
    }
  );
}
