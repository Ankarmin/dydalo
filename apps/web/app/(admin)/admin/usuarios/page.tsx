import type { Metadata } from "next";
import { UsuariosClient } from "./usuarios-client";

export const metadata: Metadata = { title: "Clientes" };

export default function UsuariosPage() {
  return <UsuariosClient />;
}
