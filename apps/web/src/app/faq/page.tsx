import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Sin vueltas. Respuestas directas sobre pedidos, envios, cambios, pagos, productos, cuenta y tallas en DYDALO.",
};
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { FaqClient } from "./faq-client";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";

export default function FaqPage() {
  return (
    <main className="page-root">
      <section className="section-px page-top pb-16">
        <div className="container-page">
          <PageBreadcrumbs
            className="mb-6"
            items={[
              { label: "Inicio", href: ROUTES.home },
              { label: "FAQ" },
            ]}
          />
        </div>
        <FaqClient />
      </section>

      <section className="border-t border-border section-px py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-2xl font-bold leading-relaxed tracking-tight md:text-3xl">
            No encontraste lo que buscabas?
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Escribenos y te respondemos en menos de 24h.
          </p>
          <Button variant="hero" size="hero" className="mt-8" asChild>
            <Link href={ROUTES.contacto}>Contacto</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
