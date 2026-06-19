import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Mis Pedidos",
};

export default function PedidosPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-heading">MIS PEDIDOS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historial de tus compras en DYDALO.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-border py-16 text-center">
        <Package
          className="mb-4 size-12 text-muted-foreground"
          strokeWidth={1.25}
        />
        <p className="text-lg font-bold">NO TIENES PEDIDOS</p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Aún no has realizado ninguna compra. Explora el catálogo y encuentra tu flow.
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link href={ROUTES.catalogo}>VER CATÁLOGO</Link>
        </Button>
      </div>
    </div>
  );
}
