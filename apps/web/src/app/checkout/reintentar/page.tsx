import type { Metadata } from "next";
import { Suspense } from "react";
import { ReintentarPagoClient } from "./reintentar-client";

export const metadata: Metadata = {
  title: "Reintentar Pago",
};

export default function ReintentarPagoPage() {
  return (
    <Suspense fallback={null}>
      <ReintentarPagoClient />
    </Suspense>
  );
}
