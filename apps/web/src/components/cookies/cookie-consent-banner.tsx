"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CookieSettingsSheet } from "./cookie-settings-sheet";
import { useCookieConsent } from "@/contexts/cookie-consent-context";
import { useMounted } from "@/hooks/use-mounted";
import { ROUTES } from "@/lib/utils/routes";
import { cn } from "@/lib/utils/utils";

const ANIMATION_DELAY_MS = 400;

export function CookieConsentBanner() {
  const mounted = useMounted();
  const { hasConsented, acceptAll } = useCookieConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!mounted || hasConsented) return;
    const timer = setTimeout(() => setVisible(true), ANIMATION_DELAY_MS);
    return () => clearTimeout(timer);
  }, [mounted, hasConsented]);

  if (!mounted) return null;

  const showBanner = !hasConsented && !dismissed && !settingsOpen;

  return (
    <>
      {showBanner && (
        <div
          role="dialog"
          aria-label="Consentimiento de cookies"
          className={cn(
            "fixed bottom-0 left-0 right-0 z-[60]",
            "border-t border-border bg-card/95 backdrop-blur-xl",
            "transition-all duration-500 ease-out",
            "pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
            visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
          )}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6 md:py-5">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Cerrar aviso de cookies"
              className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>

            <div className="pr-6 md:pr-0">
              <p className="text-xs leading-relaxed text-muted-foreground md:text-sm">
                Usamos cookies para mejorar tu experiencia. Al continuar
                navegando aceptas nuestra{" "}
                <Link
                  href={ROUTES.cookies}
                  className="font-medium text-accent underline-offset-4 hover:underline"
                >
                  política de cookies
                </Link>
                .
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-xs md:h-10 md:px-6"
                onClick={() => setSettingsOpen(true)}
              >
                Configurar
              </Button>
              <Button
                variant="hero"
                size="sm"
                className="h-9 px-5 text-xs md:h-10 md:px-8"
                onClick={acceptAll}
              >
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      )}

      {!hasConsented && (
        <CookieSettingsSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      )}
    </>
  );
}
