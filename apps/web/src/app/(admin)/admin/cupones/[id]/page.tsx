import type { Metadata } from "next";
import { CuponDetalleClient } from "./cupon-detalle-client";

export const metadata: Metadata = {
  title: "Detalle de Cupón",
};

export default async function CuponDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CuponDetalleClient id={id} />;
}
