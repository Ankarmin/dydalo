import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogGrid } from "@/components/catalog-grid";
import { products, catalogCategories } from "@/data/products";

export function generateStaticParams() {
  return catalogCategories.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = catalogCategories.find((c) => c.slug === slug);
  if (!category) return {};
  return {
    title: `${category.name} — DYDALO`,
    description: `Explora nuestra colección de ${category.name.toLowerCase()} DYDALO. Prendas diseñadas para un flow sin límites.`,
  };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = catalogCategories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const categoryProducts = products.filter((p) => p.category === slug);

  return (
    <main className="page-root">
      <section className="section-px pt-28 pb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight">
          {category.name}
        </h1>
        <p className="mt-1 text-xs font-bold tracking-[0.2em] text-muted-foreground">
          {categoryProducts.length}{" "}
          {categoryProducts.length === 1 ? "producto" : "productos"}
        </p>
      </section>

      <section className="section-px pb-16">
        {categoryProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-6xl font-black text-muted-foreground/10">
              —
            </p>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
              No hay productos en {category.name}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Pronto llegara nuevo stock.
            </p>
            <Link
              href="/catalogo"
              className="mt-6 inline-flex items-center gap-2 border-b border-accent pb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent transition-colors hover:text-accent/80"
            >
              Ver catalogo completo
            </Link>
          </div>
        ) : (
          <CatalogGrid products={categoryProducts} />
        )}
      </section>
    </main>
  );
}
