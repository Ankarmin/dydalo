"use client";

import { toast } from "sonner";
import { CheckCircle, AlertTriangle, X, Info } from "lucide-react";
import { TOAST_DURATION_MS, TOAST_CLOSE_LABEL } from "@/config/constants";

type NotificationVariant = "success" | "error" | "info";

const variants: Record<NotificationVariant, { bg: string; border: string; Icon: typeof CheckCircle }> = {
  success: { bg: "bg-success", border: "border-success", Icon: CheckCircle },
  error: { bg: "bg-danger", border: "border-danger", Icon: AlertTriangle },
  info: { bg: "bg-accent", border: "border-accent", Icon: Info },
};

export function notifyAdmin(title: string, description?: string, variant: NotificationVariant = "success") {
  const { bg, border, Icon } = variants[variant];

  toast.custom(
    (t) => (
      <div
        onClick={(e) => { e.stopPropagation(); toast.dismiss(t); }}
        className="group pointer-events-auto relative flex items-center gap-4 border border-border bg-background px-5 py-4 shadow-lg animate-in slide-in-from-right-full duration-500 cursor-pointer"
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${bg}`} />

        <div className={`relative flex size-10 shrink-0 items-center justify-center border ${border} ${bg}/10`}>
          <Icon className={`size-4 ${bg.replace("bg-", "text-")}`} />
          <span className={`absolute -right-1 -top-1 size-3 animate-pulse ${bg}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="section-tag">{title}</p>
          {description && (
            <p className="mt-0.5 truncate text-xs font-bold uppercase tracking-wider text-foreground">
              {description}
            </p>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); toast.dismiss(t); }}
          aria-label={TOAST_CLOSE_LABEL}
          className="shrink-0 p-2 text-muted-foreground transition-colors hover:text-foreground focus-ring"
        >
          <X className="size-3.5" />
        </button>

        <div className={`absolute bottom-0 left-0 h-0.5 w-full ${bg} origin-left animate-shimmer`} />
      </div>
    ),
    {
      duration: TOAST_DURATION_MS,
      position: "bottom-right",
    },
  );
}
