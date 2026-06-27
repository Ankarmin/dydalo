"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-4">
        <AlertTriangle className="size-12 mx-auto text-destructive" />
        <h2 className="text-xl font-bold">Error en el panel</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "Ocurrió un error inesperado."}
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} variant="outline" size="sm">
            Reintentar
          </Button>
          <Button onClick={() => router.push(ROUTES.admin)} variant="default" size="sm">
            Ir al Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
