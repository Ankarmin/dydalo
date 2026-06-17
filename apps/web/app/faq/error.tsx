'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function FaqError({
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-5 text-center">
      <p className="text-sm text-muted-foreground">
        Algo salió mal al cargar esta página.
      </p>
      <Button variant="street" onClick={reset}>
        Reintentar
      </Button>
    </main>
  );
}
