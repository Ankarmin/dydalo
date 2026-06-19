"use client";

import { toast } from "sonner";
import { Heart, X } from "lucide-react";
import { TOAST_DURATION_MS } from "@/lib/constants";

export function showFavoriteToast(productName: string, added: boolean) {
  toast.custom(
    (t) => (
      <div
        onClick={() => toast.dismiss(t)}
        className="group relative flex items-center gap-4 border border-border bg-background px-5 py-4 shadow-lg animate-in slide-in-from-right-full duration-500 cursor-pointer"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-favorite" />

        <div className="relative flex size-10 shrink-0 items-center justify-center border border-favorite bg-favorite/10">
          <Heart
            className={`size-4 text-favorite transition-all ${added ? "fill-favorite" : ""}`}
          />
          <span className="absolute -right-1 -top-1 size-3 animate-pulse bg-favorite" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="overline">
            {added ? "guardado en favoritos" : "eliminado de favoritos"}
          </p>
          <p className="mt-0.5 truncate text-xs font-bold uppercase tracking-wider text-foreground">
            {productName}
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); toast.dismiss(t); }}
          aria-label="Cerrar notificación"
          className="shrink-0 p-2 text-muted-foreground transition-colors hover:text-foreground focus-ring"
        >
          <X className="size-3.5" />
        </button>

        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-favorite origin-left animate-shimmer" />
      </div>
    ),
    {
      duration: TOAST_DURATION_MS,
      position: "bottom-right",
    },
  );
}
