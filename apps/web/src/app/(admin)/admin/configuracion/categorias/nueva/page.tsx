import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = {
  title: "Nueva Categoría",
};

export default function CategoriaNuevaPage() {
  return <CategoryForm />;
}
