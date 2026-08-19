"use client";

import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { TOAST_CLOSE_LABEL, TOAST_DURATION_MS } from "@/config/constants";

type ShareToastVariant = "success" | "error";

const variants: Record<
  ShareToastVariant,
  { accent: string; border: string; Icon: typeof CheckCircle }
> = {
  success: { accent: "bg-success", border: "border-success", Icon: CheckCircle },
  error: { accent: "bg-danger", border: "border-danger", Icon: AlertTriangle },
};

function showShareToast(
  variant: ShareToastVariant,
  title: string,
  description: string,
) {
  const { accent, border, Icon } = variants[variant];

  toast.custom(
    (t) => (
      <div
        onClick={(event) => {
          event.stopPropagation();
          toast.dismiss(t);
        }}
        className="group pointer-events-auto relative flex cursor-pointer items-center gap-4 border border-border bg-background px-5 py-4 shadow-lg animate-in slide-in-from-right-full duration-500"
      >
        <div className={`absolute bottom-0 left-0 top-0 w-1 ${accent}`} />
        <div className={`relative flex size-10 shrink-0 items-center justify-center border ${border} ${accent}/10`}>
          <Icon className={`size-4 ${accent.replace("bg-", "text-")}`} />
          <span className={`absolute -right-1 -top-1 size-3 animate-pulse ${accent}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="section-tag">{title}</p>
          <p className="mt-0.5 truncate text-xs font-bold uppercase tracking-wider text-foreground">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toast.dismiss(t);
          }}
          aria-label={TOAST_CLOSE_LABEL}
          className="shrink-0 p-2 text-muted-foreground transition-colors hover:text-foreground focus-ring"
        >
          <X className="size-3.5" />
        </button>

        <div className={`absolute bottom-0 left-0 h-0.5 w-full origin-left animate-shimmer ${accent}`} />
      </div>
    ),
    {
      duration: TOAST_DURATION_MS,
      position: "bottom-right",
    },
  );
}

export function showShareSuccessToast() {
  showShareToast("success", "enlace copiado", "Listo para compartir");
}

export function showShareErrorToast() {
  showShareToast("error", "no se pudo copiar", "Inténtalo nuevamente");
}

export function showShareFailedToast() {
  showShareToast("error", "no se pudo compartir", "Inténtalo nuevamente");
}
