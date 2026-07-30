import type { Metadata } from "next";
import { AuditoriaClient } from "./auditoria-client";

export const metadata: Metadata = {
  title: "Auditoría",
};

export default function AuditoriaPage() {
  return <AuditoriaClient />;
}
