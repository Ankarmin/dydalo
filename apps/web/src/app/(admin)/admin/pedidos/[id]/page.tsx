import type { Metadata } from "next";
import { PedidoDetalleClient } from "./pedido-detalle-client";

export const metadata: Metadata = {
  title: "Detalle de Pedido",
};

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PedidoDetalleClient id={id} />;
}
