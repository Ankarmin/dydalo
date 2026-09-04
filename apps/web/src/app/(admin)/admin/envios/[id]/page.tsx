import type { Metadata } from "next";
import { EnvioDetalleClient } from "./envio-detalle-client";

export const metadata: Metadata = {
  title: "Detalle de Envío",
};

export default async function EnvioDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EnvioDetalleClient id={id} />;
}
