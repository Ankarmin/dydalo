import type { Metadata } from "next";
import { CartClient } from "./_components/cart-client";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa tu carrito de compras y finaliza tu pedido en DYDALO.",
};

export default function CarritoPage() {
  return (
    <main className="page-root">
      <section className="page-hero">
        <div className="container-page">
          <p className="section-tag">Carrito</p>
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
