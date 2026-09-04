import type { Metadata } from "next";
import { ProveedoresClient } from "./proveedores-client";

export const metadata: Metadata = {
  title: "Proveedores",
};

export default function ProveedoresPage() {
  return <ProveedoresClient />;
}
