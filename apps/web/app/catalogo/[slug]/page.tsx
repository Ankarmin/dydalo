import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoriesStore } from "@/lib/data-store.categories";
import { catalogCategories } from "@/data/products";
import { CategoriaClient } from "./categoria-client";

export function generateStaticParams() {
  const cats = categoriesStore.getAll();
  if (cats.length === 0) return catalogCategories.map((cat) => ({ slug: cat.slug }));
  return cats.filter((c) => c.active).map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = categoriesStore.getBySlug(slug) ?? catalogCategories.find((c) => c.slug === slug);
  if (!category) return {};
  const name = (category as any).name as string;
  return { title: name, description: `Explora nuestra colección de ${name.toLowerCase()} DYDALO.` };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categoriesStore.getBySlug(slug);
  const fallback = catalogCategories.find((c) => c.slug === slug);

  if (!category && !fallback) notFound();
  if (category && !category.active) notFound();

  const categoryName = (category as any)?.name ?? (fallback as any)?.name ?? slug;

  return (
    <main className="page-root">
      <section className="section-px page-top pb-16">
        <CategoriaClient slug={slug} categoryName={categoryName} />
      </section>
    </main>
  );
}
