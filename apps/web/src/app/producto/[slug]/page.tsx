import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products as hardcodedProducts } from "@/config/products";
import { productsStore } from "@/lib/stores/data-store.products";
import { ProductDetail } from "./_components/product-detail";

interface ProductoPageProps {
  params: Promise<{ slug: string }>;
}

function findProduct(slug: string) {
  const fromStore = productsStore.getBySlug(slug);
  if (fromStore) return fromStore;
  const fromHardcoded = hardcodedProducts.find((p) => p.slug === slug);
  if (!fromHardcoded) return null;
  return {
    ...fromHardcoded,
    stock: 50,
    active: true,
    featured: false,
    discount: null,
    sku: "",
    createdAt: "",
    updatedAt: "",
  };
}

export async function generateMetadata({
  params,
}: ProductoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: `${product.name} | DYDALO`,
    description:
      product.description ??
      `Compra ${product.name} en DYDALO. Envíos a todo el Perú.`,
  };
}

export function generateStaticParams() {
  return hardcodedProducts.map((p) => ({ slug: p.slug }));
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
