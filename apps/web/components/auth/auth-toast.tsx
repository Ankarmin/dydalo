"use client";

import { toast } from "sonner";
import { User, LogOut, ShoppingBag, X } from "lucide-react";
import { TOAST_DURATION_MS, TOAST_CLOSE_LABEL } from "@/lib/constants";

const FAVORITE = { bg: "bg-favorite", border: "border-favorite" } as const;
const MUTED = { bg: "bg-muted-foreground", border: "border-muted-foreground" } as const;

type Accent = { bg: string; border: string };

function notify(
  icon: React.ReactNode,
  accent: Accent,
  title: string,
  description?: string,
) {
  toast.custom(
    (t) => (
      <div
        data-toast-notification
        onClick={(e) => { e.stopPropagation(); toast.dismiss(t); }}
        className="group pointer-events-auto relative flex items-center gap-4 border border-border bg-background px-5 py-4 shadow-lg animate-in slide-in-from-right-full duration-500 cursor-pointer"
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent.bg}`} />

        <div className={`relative flex size-10 shrink-0 items-center justify-center border ${accent.bg} ${accent.border} ${accent.bg}/10`}>
          {icon}
          <span className={`absolute -right-1 -top-1 size-3 animate-pulse ${accent.bg}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="overline">{title}</p>
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

        <div className={`absolute bottom-0 left-0 h-0.5 w-full ${accent.bg} origin-left animate-shimmer`} />
      </div>
    ),
    {
      duration: TOAST_DURATION_MS,
      position: "bottom-right",
    },
  );
}

export function showLoginSuccessToast() {
  notify(
    <User className="size-4 text-favorite" />,
    FAVORITE,
    "inicio de sesión exitoso",
    "Bienvenido de vuelta a tu flow",
  );
}

export function showRegisterSuccessToast() {
  notify(
    <User className="size-4 text-favorite" />,
    FAVORITE,
    "cuenta creada",
    "Bienvenido a DYDALO",
  );
}

export function showLogoutToast() {
  notify(
    <LogOut className="size-4 text-muted-foreground" />,
    MUTED,
    "sesión cerrada",
    "Vuelve pronto",
  );
}

export function showRecoveryEmailToast() {
  notify(
    <User className="size-4 text-favorite" />,
    FAVORITE,
    "email enviado",
    "Revisa tu bandeja de entrada",
  );
}

export function showGoogleComingSoonToast() {
  notify(
    <User className="size-4 text-favorite" />,
    FAVORITE,
    "próximamente",
    "Google login disponible pronto",
  );
}

export function showComingSoonToast() {
  notify(
    <ShoppingBag className="size-4 text-muted-foreground" />,
    MUTED,
    "próximamente",
    "Esta funcionalidad estará disponible pronto",
  );
}
