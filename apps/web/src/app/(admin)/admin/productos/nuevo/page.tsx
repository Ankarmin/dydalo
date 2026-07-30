import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = {
  title: "Nuevo Producto",
};

export default function ProductoNuevoPage() {
  return <ProductForm />;
}
