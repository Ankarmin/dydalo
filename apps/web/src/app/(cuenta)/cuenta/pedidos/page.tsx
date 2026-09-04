import type { Metadata } from "next";
import { CuentaPedidosClient } from "./cuenta-pedidos-client";

export const metadata: Metadata = {
  title: "Mis Pedidos",
};

export default function PedidosPage() {
  return <CuentaPedidosClient />;
}
