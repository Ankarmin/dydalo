import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "Editar Categoría" };

export default async function CategoriaEditarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CategoryForm slug={slug} />;
}
