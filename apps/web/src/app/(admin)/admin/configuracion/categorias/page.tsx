import type { Metadata } from "next";
import { CategoriasClient } from "./categorias-client";

export const metadata: Metadata = { title: "Categorías" };

export default function CategoriasPage() {
  return <CategoriasClient />;
}
