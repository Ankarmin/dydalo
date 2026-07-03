import type { Metadata } from "next";
import { CategoriaNuevaClient } from "./categoria-nueva-client";

export const metadata: Metadata = { title: "Nueva Categoría" };

export default function CategoriaNuevaPage() {
  return <CategoriaNuevaClient />;
}
