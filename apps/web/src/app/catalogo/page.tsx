import type { Metadata } from "next";
import { CatalogoClient } from "./catalogo-client";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";
import { ROUTES } from "@/lib/utils/routes";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Explora el catálogo completo de DYDALO por categorías. Polos, sets, casacas, hoodies, pantalones, jeans, camisas, tanks, básicos y accesorios.",
};

export default function CatalogoPage() {
  return (
    <main className="page-root">
      <section className="section-px page-top pb-16">
        <PageBreadcrumbs
          className="mb-6"
          items={[
            { label: "Home", href: ROUTES.home },
            { label: "Catálogo" },
          ]}
        />
        <CatalogoClient />
      </section>
    </main>
  );
}
