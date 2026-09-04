import type { Metadata } from "next";
import { ComprasClient } from "./compras-client";

export const metadata: Metadata = {
  title: "Compras",
};

export default function ComprasPage() {
  return <ComprasClient />;
}
