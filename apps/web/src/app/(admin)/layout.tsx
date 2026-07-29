import type { Metadata } from "next";
import { AdminLayoutClient } from "./admin-layout-client";

export const metadata: Metadata = {
  title: {
    template: "%s — Admin DYDALO",
    default: "Admin — DYDALO",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
