import type { Metadata } from "next";
import { UsuarioDetalleClient } from "./usuario-detalle-client";

export const metadata: Metadata = { title: "Detalle de Cliente" };

export default async function UsuarioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UsuarioDetalleClient id={id} />;
}
