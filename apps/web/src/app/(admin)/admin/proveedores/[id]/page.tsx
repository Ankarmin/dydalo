import type { Metadata } from "next";
import { ProveedorDetalleClient } from "./proveedor-detalle-client";

export const metadata: Metadata = {
  title: "Detalle de Proveedor",
};

export default async function ProveedorDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProveedorDetalleClient id={id} />;
}
