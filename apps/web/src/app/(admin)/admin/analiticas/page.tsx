import type { Metadata } from "next";
import { AnaliticasClient } from "./analiticas-client";

export const metadata: Metadata = {
  title: "Analíticas",
};

export default function AnaliticasPage() {
  return <AnaliticasClient />;
}
