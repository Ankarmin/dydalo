import type { Metadata } from "next";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Direcciones",
};

export default function DireccionesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">
            DIRECCIONES
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona tus direcciones de envío.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nueva</span>
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-border py-16 text-center">
        <MapPin
          className="mb-4 size-12 text-muted-foreground"
          strokeWidth={1.25}
        />
        <p className="text-lg font-bold">NO TIENES DIRECCIONES</p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Agrega una dirección para agilizar tus compras futuras.
        </p>
        <Button variant="outline" className="mt-6" disabled>
          <Plus className="size-4" />
          AGREGAR DIRECCIÓN
        </Button>
      </div>
    </div>
  );
}
