import type { Metadata } from "next";
import { Suspense } from "react";
import { CompraNuevaClient } from "./compra-nueva-client";

export const metadata: Metadata = {
  title: "Nueva Compra",
};

export default function CompraNuevaPage() {
  return (
    <Suspense fallback={null}>
      <CompraNuevaClient />
    </Suspense>
  );
}
