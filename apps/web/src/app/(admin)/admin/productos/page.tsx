import type { Metadata } from "next";
import { ProductosClient } from "./productos-client";

export const metadata: Metadata = {
  title: "Productos",
};

export default function ProductosPage() {
  return <ProductosClient />;
}
