// Lectura de catálogo/blog/config desde el backend (Fase 7).
// Mapea las respuestas a los tipos del frontend para no tocar componentes.
import { apiFetch } from "./client";
import type {
  AdminProduct,
  BlogPost,
  CatalogCategory,
  ProductSize,
  ProductVariantStock,
  SiteConfig,
  SizeGuideData,
} from "@/lib/stores/data-store.types";

type ApiVariant = {
  id: string;
  key?: string;
  size: string;
  color: string;
  stock: number;
  active: boolean;
  lowStockThreshold?: number | null;
  sku?: string | null;
};

type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  category: { slug: string; name: string };
  price: number;
  image: string;
  images?: string[];
  colors: Array<{ name: string; hex: string }>;
  stock: number;
  active: boolean;
  featured: boolean;
  discount?: number | null;
  sku: string;
  description?: string | null;
  costPrice?: number | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  updatedAt: string;
  variants?: ApiVariant[];
};

function mapVariant(v: ApiVariant): ProductVariantStock {
  return {
    id: v.id,
    size: v.size as ProductSize,
    color: v.color,
    stock: v.stock,
    active: v.active,
    lowStockThreshold: v.lowStockThreshold ?? undefined,
    sku: v.sku ?? undefined,
    updatedAt: new Date().toISOString(),
  };
}

export function mapApiProduct(p: ApiProduct): AdminProduct {
  const variants = (p.variants ?? []).map(mapVariant);
  const sizes = [...new Set(variants.map((v) => v.size))] as ProductSize[];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category.slug,
    price: p.price,
    image: p.image,
    images: p.images ?? [],
    sizes: sizes.length > 0 ? sizes : ["Unica"],
    colors: p.colors ?? [],
    stock: p.stock,
    variants,
    active: p.active,
    featured: p.featured,
    discount: p.discount ?? null,
    sku: p.sku,
    description: p.description ?? undefined,
    costPrice: p.costPrice ?? undefined,
    metaTitle: p.metaTitle ?? undefined,
    metaDescription: p.metaDescription ?? undefined,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

type Page<T> = { data: T[]; total: number; page: number; limit: number };

// Caché compartida del catálogo base (sin filtros) entre todas las instancias
// de useProducts: un solo vuelo a la red, reintento natural por remontaje y
// notificación a todas las instancias cuando cualquier reintento tiene éxito
// (p. ej. API que termina de arrancar después que la web).
type ProductsListener = (list: AdminProduct[]) => void;

const productsListeners = new Set<ProductsListener>();
let cachedProducts: AdminProduct[] | null = null;
let productsInflight: Promise<AdminProduct[]> | null = null;

function setCachedProducts(list: AdminProduct[]): void {
  cachedProducts = list;
  productsListeners.forEach((listener) => listener(list));
}

export function getCachedProducts(): AdminProduct[] | null {
  return cachedProducts;
}

export function subscribeProducts(listener: ProductsListener): () => void {
  productsListeners.add(listener);
  return () => {
    productsListeners.delete(listener);
  };
}

export function clearProductsCache(): void {
  cachedProducts = null;
  productsInflight = null;
}

export function apiGetProductsCached(): Promise<AdminProduct[]> {
  if (cachedProducts) return Promise.resolve(cachedProducts);
  if (!productsInflight) {
    productsInflight = apiGetProducts().then(
      (list) => {
        productsInflight = null;
        setCachedProducts(list);
        return list;
      },
      (error: unknown) => {
        productsInflight = null;
        throw error;
      },
    );
  }
  return productsInflight;
}

export async function apiGetProducts(params: {
  category?: string;
  search?: string;
  featured?: boolean;
  sort?: "newest" | "price-asc" | "price-desc" | "name";
} = {}): Promise<AdminProduct[]> {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.search) q.set("search", params.search);
  if (params.featured !== undefined) q.set("featured", String(params.featured));
  if (params.sort) q.set("sort", params.sort);
  q.set("limit", "100");
  const page = await apiFetch<Page<ApiProduct>>(`/products?${q.toString()}`);
  return page.data.map(mapApiProduct);
}

export async function apiGetProductBySlug(slug: string): Promise<AdminProduct | null> {
  try {
    const product = await apiFetch<ApiProduct>(
      `/products/${encodeURIComponent(slug)}`,
    );
    return mapApiProduct(product);
  } catch {
    return null;
  }
}

export function mapApiCategory(c: {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  order: number;
  description?: string | null;
  image?: string | null;
  sizeGuide?: unknown;
  createdAt: string;
  updatedAt: string;
}): CatalogCategory {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    active: c.active,
    order: c.order,
    description: c.description ?? undefined,
    image: c.image ?? undefined,
    sizeGuide: (c.sizeGuide as SizeGuideData | undefined) ?? undefined,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export async function apiGetCategories(): Promise<CatalogCategory[]> {
  const categories = await apiFetch<Parameters<typeof mapApiCategory>[0][]>(
    "/categories",
  );
  return categories.map(mapApiCategory);
}

export async function apiGetPosts(): Promise<BlogPost[]> {
  return apiFetch<BlogPost[]>("/blog");
}

export async function apiGetSiteConfig(): Promise<SiteConfig> {
  return apiFetch<SiteConfig>("/site-config");
}
