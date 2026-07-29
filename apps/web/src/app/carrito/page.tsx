import type { Metadata } from "next";
import { CartClient } from "./_components/cart-client";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";
import { ROUTES } from "@/lib/utils/routes";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa tu carrito de compras y finaliza tu pedido en DYDALO.",
};

export default function CarritoPage() {
  return (
    <main className="page-root">
      <section className="page-hero">
        <div className="container-page">
          <PageBreadcrumbs
            className="mb-4"
            items={[
              { label: "Home", href: ROUTES.home },
              { label: "Carrito" },
            ]}
          />
          <h1 className="page-hero-heading">Tu selección.</h1>
        </div>
      </section>
      <section className="section-px pb-20 pt-8">
        <div className="mx-auto max-w-6xl">
          <CartClient />
        </div>
      </section>
    </main>
  );
}
