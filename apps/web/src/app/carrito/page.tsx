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
      <section className="section-px page-top pb-20">
        <div className="container-page mb-6">
          <PageBreadcrumbs
            items={[
              { label: "Home", href: ROUTES.home },
              { label: "Carrito" },
            ]}
          />
        </div>
        <div className="mx-auto max-w-6xl">
          <CartClient />
        </div>
      </section>
    </main>
  );
}
