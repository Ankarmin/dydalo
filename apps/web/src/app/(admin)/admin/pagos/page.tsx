import type { Metadata } from "next";
import { PagosClient } from "./pagos-client";

export const metadata: Metadata = {
  title: "Pagos",
};

export default function PagosPage() {
  return <PagosClient />;
}
