import type { Metadata } from "next";
import { CategoriaEditarClient } from "./categoria-editar-client";

export const metadata: Metadata = { title: "Editar Categoría" };

export default async function CategoriaEditarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CategoriaEditarClient slug={slug} />;
}
