import type { Metadata } from "next";
import { CreateOrderForm } from "@/components/admin/create-order-form";

export const metadata: Metadata = {
  title: "Nuevo Pedido",
};

export default function PedidoNuevoPage() {
  return <CreateOrderForm />;
}
