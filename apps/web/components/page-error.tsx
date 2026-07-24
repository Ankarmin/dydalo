"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface PageErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function PageError({ error, reset }: PageErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background section-px text-center">
      <p className="text-sm text-muted-foreground">
        Algo salió mal al cargar la página.
      </p>
      <Button variant="street" onClick={reset}>
        Reintentar
      </Button>
    </main>
  );
}
