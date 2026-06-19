import type { Metadata } from "next";
import { products } from "@/data/products";
import { CatalogGrouped } from "@/components/catalog-grouped";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Explora el catálogo completo de DYDALO por categorías. Polos, sets, casacas, hoodies, pantalones, jeans, camisas, tanks, básicos y accesorios.",
};

export default function CatalogoPage() {
  return (
    <main className="page-root">
      <section className="section-px page-top pb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight">
          CATÁLOGO DYDALO
        </h1>
        <p className="mt-1 text-xs font-bold tracking-[0.2em] text-muted-foreground">
          {products.length} {products.length === 1 ? "producto" : "productos"}{" "}
          · {10} categorías
        </p>
      </section>

      <section className="section-px pb-16">
        <CatalogGrouped />
      </section>
    </main>
  );
}
