"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ignoreToastClicks } from "@/lib/utils/toast-guard";

export function HomeNewsletter() {
  const [newsletterEmail, setNewsletterEmail] = useState<string | null>(null);
  const newsletterRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <section className="border-t border-border section-px py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center md:text-left">
            <p className="heading-label">Únete al movimiento</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sé el primero en enterarte de nuevos drops y exclusivos.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = newsletterRef.current?.value;
              if (value) {
                setNewsletterEmail(value);
                if (newsletterRef.current) newsletterRef.current.value = "";
              }
            }}
            className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:gap-0"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Correo electrónico
            </label>
            <input
              id="newsletter-email"
              ref={newsletterRef}
              type="email"
              required
              placeholder="tu@email.com"
              className="form-input flex-1"
            />
            <button type="submit" className="newsletter-btn">
              Suscribir
            </button>
          </form>
        </div>
      </section>

      <Dialog
        open={newsletterEmail !== null}
        onOpenChange={() => setNewsletterEmail(null)}
      >
        <DialogContent
          className="border-border bg-background sm:max-w-sm"
          onInteractOutside={ignoreToastClicks}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight">
              GRACIAS
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Te mantendremos al tanto de nuevos drops y exclusivos en{" "}
              <span className="font-bold text-foreground">
                {newsletterEmail}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="hero"
            className="mt-2 w-full"
            onClick={() => setNewsletterEmail(null)}
          >
            ENTENDIDO
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
