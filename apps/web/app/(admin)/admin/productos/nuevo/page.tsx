import type { Metadata } from "next";
import { ProductoNuevoClient } from "./producto-nuevo-client";

export const metadata: Metadata = {
  title: "Nuevo Producto",
};

export default function ProductoNuevoPage() {
  return <ProductoNuevoClient />;
}
