"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, BarChart3, Settings } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/contexts/cookie-consent-context";
import { ROUTES } from "@/lib/utils/routes";
import { cn } from "@/lib/utils/utils";

const COOKIE_CATEGORIES = [
  {
    key: "essential" as const,
    label: "Cookies Esenciales",
    description:
      "Necesarias para el funcionamiento básico. Permiten navegar, agregar productos al carrito y procesar pagos. El sitio no funciona sin ellas.",
    icon: ShieldCheck,
    required: true,
  },
  {
    key: "performance" as const,
    label: "Cookies de Rendimiento",
    description:
      "Recopilan información anónima sobre cómo usas el sitio: páginas más visitadas, tiempo de navegación y posibles errores. Nos ayudan a mejorar.",
    icon: BarChart3,
    required: false,
  },
  {
    key: "functional" as const,
    label: "Cookies Funcionales",
    description:
      "Recuerdan tus preferencias como el tema claro/oscuro, productos vistos recientemente y favoritos. Hacen tu experiencia más personalizada.",
    icon: Settings,
    required: false,
  },
] as const;

interface CookieSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookieSettingsSheet({
  open,
  onOpenChange,
}: CookieSettingsSheetProps) {
  const { savePreferences } = useCookieConsent();
  const [preferences, setPreferences] = useState({
    essential: true,
    performance: false,
    functional: false,
  });

  const handleSave = () => {
    savePreferences(preferences);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "h-auto max-h-[80vh] overflow-y-auto border-t border-border bg-card",
          "md:side-right md:max-w-md",
        )}
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-bold uppercase tracking-tight">
            Configuración de cookies
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Personaliza qué cookies aceptas. Las esenciales no pueden
            desactivarse.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {COOKIE_CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex items-start gap-3">
              <cat.icon
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  cat.required ? "text-muted-foreground" : "text-accent",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor={`cookie-${cat.key}`}
                    className="cursor-pointer text-sm font-bold text-foreground"
                  >
                    {cat.label}
                  </label>
                  {cat.required ? (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Siempre activo
                    </span>
                  ) : (
                    <Switch
                      id={`cookie-${cat.key}`}
                      checked={preferences[cat.key]}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          [cat.key]: checked,
                        }))
                      }
                    />
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            variant="hero"
            size="hero"
            className="w-full"
            onClick={handleSave}
          >
            Guardar configuración
          </Button>
          <Link
            href={ROUTES.cookies}
            onClick={() => onOpenChange(false)}
            className="text-center text-[11px] text-accent transition-colors hover:underline"
          >
            Leer política de cookies completa &rarr;
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
