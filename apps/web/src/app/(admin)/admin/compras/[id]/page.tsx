import type { Metadata } from "next";
import { CompraDetalleClient } from "./compra-detalle-client";

export const metadata: Metadata = {
  title: "Detalle de Compra",
};

export default async function CompraDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CompraDetalleClient id={id} />;
}
