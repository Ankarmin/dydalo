import type { Metadata } from "next";
import { CatalogGrid } from "@/components/catalog-grid";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Catálogo — DYDALO",
  description:
    "Explora el catálogo completo de DYDALO. Polos, sets, casacas, hoodies, pantalones, jeans, camisas, tanks, básicos y accesorios.",
};

export default function CatalogoPage() {
  return (
    <main className="page-root">
      <section className="section-px pt-28 pb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight">
          CATÁLOGO DYDALO
        </h1>
        <p className="mt-1 text-xs font-bold tracking-[0.2em] text-muted-foreground">
          {products.length} {products.length === 1 ? "producto" : "productos"}
        </p>
      </section>

      <section className="section-px pb-16">
        <CatalogGrid products={products} />
      </section>
    </main>
  );
}
