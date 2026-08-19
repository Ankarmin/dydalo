import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products } from "@/config/products";
import { productsStore } from "@/lib/stores/data-store.products";
import { ProductDetail } from "./_components/product-detail";

interface ProductoPageProps {
  params: Promise<{ slug: string }>;
}

function findProduct(slug: string) {
  return productsStore.getBySlug(slug) ?? products.find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: ProductoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: `${product.name} | DYDALO`,
    description: `Compra ${product.name} en DYDALO. Envíos a todo el Perú.`,
    alternates: {
      canonical: `/producto/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | DYDALO`,
      description: `Compra ${product.name} en DYDALO. Envíos a todo el Perú.`,
      type: "website",
      url: `/producto/${product.slug}`,
      images: product.image ? [{ url: product.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | DYDALO`,
      description: `Compra ${product.name} en DYDALO. Envíos a todo el Perú.`,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductoPage({ params }: ProductoPageProps) {
  const { slug } = await params;
  const product = findProduct(slug);

  if (!product) notFound();

  return (
    <main className="page-root">
      <section className="section-px pb-20 pt-24 md:pt-28">
        <div className="mx-auto max-w-6xl">
          <ProductDetail product={product} />
        </div>
      </section>
    </main>
  );
}
