"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function FavoritosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center section-px pt-24 text-center">
      <h2 className="text-xl font-bold">Algo salió mal</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        No pudimos cargar tus favoritos.
      </p>
      <Button variant="outline" className="mt-4" onClick={reset}>
        Reintentar
      </Button>
    </main>
  );
}
