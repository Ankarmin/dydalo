import type { Metadata } from "next";
import { PagoDetalleClient } from "./pago-detalle-client";

export const metadata: Metadata = {
  title: "Detalle de Pago",
};

export default async function PagoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PagoDetalleClient id={id} />;
}
