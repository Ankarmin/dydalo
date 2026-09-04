import type { Metadata } from "next";
import { DevolucionesClient } from "./devoluciones-client";

export const metadata: Metadata = {
  title: "Devoluciones",
};

export default function DevolucionesPage() {
  return <DevolucionesClient />;
}
