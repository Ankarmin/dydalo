import type { Metadata } from "next";
import { DevolucionDetalleClient } from "./devolucion-detalle-client";

export const metadata: Metadata = {
  title: "Detalle de Devolución",
};

export default async function DevolucionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DevolucionDetalleClient id={id} />;
}
