import type { Metadata } from "next";
import { PedidosClient } from "./pedidos-client";

export const metadata: Metadata = {
  title: "Pedidos",
};

export default function PedidosPage() {
  return <PedidosClient />;
}
