import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import { catalogCategories } from "@/config/products";
import { CategoriaClient } from "./categoria-client";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";
import { ROUTES } from "@/lib/utils/routes";

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
  const name = (category as { name: string } | undefined)?.name;
  return { title: name ?? slug, description: `Explora nuestra colección de ${(name ?? slug).toLowerCase()} DYDALO.` };
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

  const categoryName = (category as { name: string } | undefined)?.name
    ?? (fallback as { name: string } | undefined)?.name
    ?? slug;

  return (
    <main className="page-root">
      <section className="section-px page-top pb-16">
        <PageBreadcrumbs
          className="mb-6"
          items={[
            { label: "Inicio", href: ROUTES.home },
            { label: "Catálogo", href: ROUTES.catalogo },
            { label: categoryName },
          ]}
        />
        <CategoriaClient slug={slug} categoryName={categoryName} />
      </section>
    </main>
  );
}
