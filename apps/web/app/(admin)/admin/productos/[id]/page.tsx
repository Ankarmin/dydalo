import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductoEditarClient } from "./producto-editar-client";

export const metadata: Metadata = {
  title: "Editar Producto",
};

export default async function ProductoEditarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) notFound();

  return <ProductoEditarClient id={numId} />;
}
