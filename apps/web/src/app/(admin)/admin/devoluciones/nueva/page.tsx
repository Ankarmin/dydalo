import type { Metadata } from "next";
import { Suspense } from "react";
import { DevolucionNuevaClient } from "./devolucion-nueva-client";

export const metadata: Metadata = {
  title: "Nueva Devolución",
};

export default function DevolucionNuevaPage() {
  return (
    <Suspense fallback={null}>
      <DevolucionNuevaClient />
    </Suspense>
  );
}
