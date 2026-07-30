import type { AdminProduct, OrderItem, ProductSize, ProductVariantStock } from "@/lib/stores/data-store.types";
import { LOW_STOCK_THRESHOLD } from "@/config/constants";

const DEFAULT_LOW_STOCK_THRESHOLD = LOW_STOCK_THRESHOLD;
const LEGACY_LOW_STOCK_THRESHOLD = 5;

export type InventoryVariantStatus = {
  product: AdminProduct;
  variant: ProductVariantStock;
  threshold: number;
};

export function getVariantKey(size: string, color: string): string {
  return `${size.trim().toLowerCase()}|${color.trim().toLowerCase()}`;
}

export function getVariantId(size: string, color: string): string {
  return getVariantKey(size, color)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTotalStock(product: AdminProduct): number {
  const variants = product.variants ?? [];
  if (variants.length === 0) return product.stock;
  return variants.reduce((sum, variant) => sum + (variant.active ? variant.stock : 0), 0);
}

export function normalizeProductInventory(product: AdminProduct): AdminProduct {
  const now = new Date().toISOString();
  const hasExistingVariants = (product.variants ?? []).length > 0;
  const existing = new Map(
    (product.variants ?? []).map((variant) => [getVariantKey(variant.size, variant.color), variant])
  );
  const variants: ProductVariantStock[] = [];
  let assignedLegacyStock = false;

  for (const size of product.sizes) {
    for (const color of product.colors) {
      const key = getVariantKey(size, color.name);
      const current = existing.get(key);
      const stock = current
        ? Math.max(0, Math.trunc(current.stock))
        : !hasExistingVariants && !assignedLegacyStock
          ? Math.max(0, Math.trunc(product.stock))
          : 0;

      variants.push({
        id: current?.id ?? getVariantId(size, color.name),
        size,
        color: color.name,
        stock,
        active: current?.active ?? true,
        lowStockThreshold: current?.lowStockThreshold === LEGACY_LOW_STOCK_THRESHOLD
          ? DEFAULT_LOW_STOCK_THRESHOLD
          : current?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
        updatedAt: current?.updatedAt ?? now,
      });

      if (!current) assignedLegacyStock = true;
    }
  }

  const normalized = { ...product, variants };
  return { ...normalized, stock: getTotalStock(normalized) };
}

export function getProductVariants(product: AdminProduct): ProductVariantStock[] {
  return normalizeProductInventory(product).variants ?? [];
}

export function getVariantStock(product: AdminProduct, size: string, color: string): number {
  const variant = getProductVariants(product).find(
    (item) => getVariantKey(item.size, item.color) === getVariantKey(size, color)
  );
  return variant?.active ? variant.stock : 0;
}

export function isVariantAvailable(product: AdminProduct, size: string, color: string, quantity = 1): boolean {
  return getVariantStock(product, size, color) >= quantity;
}

export function getAvailableSizes(product: AdminProduct): ProductSize[] {
  const variants = getProductVariants(product);
  return product.sizes.filter((size) =>
    variants.some((variant) => variant.size === size && variant.active && variant.stock > 0)
  );
}

export function getAvailableColorsForSize(product: AdminProduct, size: string): string[] {
  return getProductVariants(product)
    .filter((variant) => variant.size === size && variant.active && variant.stock > 0)
    .map((variant) => variant.color);
}

export function getVariantLowStockThreshold(variant: ProductVariantStock): number {
  return variant.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
}

export function isLowStockVariant(variant: ProductVariantStock): boolean {
  return variant.active && variant.stock > 0 && variant.stock <= getVariantLowStockThreshold(variant);
}

export function isOutOfStockVariant(variant: ProductVariantStock): boolean {
  return variant.active && variant.stock === 0;
}

export function getLowStockVariants(products: AdminProduct[]): InventoryVariantStatus[] {
  return products
    .filter((product) => product.active)
    .flatMap((product) =>
      getProductVariants(product)
        .filter(isLowStockVariant)
        .map((variant) => ({ product, variant, threshold: getVariantLowStockThreshold(variant) }))
    )
    .sort((a, b) => a.variant.stock - b.variant.stock || a.product.name.localeCompare(b.product.name));
}

export function getOutOfStockVariants(products: AdminProduct[]): InventoryVariantStatus[] {
  return products
    .filter((product) => product.active)
    .flatMap((product) =>
      getProductVariants(product)
        .filter(isOutOfStockVariant)
        .map((variant) => ({ product, variant, threshold: getVariantLowStockThreshold(variant) }))
    )
    .sort((a, b) => a.product.name.localeCompare(b.product.name));
}

export function getInventorySummary(product: AdminProduct): {
  total: number;
  activeVariants: number;
  lowStockVariants: ProductVariantStock[];
  outOfStockVariants: ProductVariantStock[];
} {
  const variants = getProductVariants(product);
  return {
    total: getTotalStock(product),
    activeVariants: variants.filter((variant) => variant.active).length,
    lowStockVariants: variants.filter(isLowStockVariant),
    outOfStockVariants: variants.filter(isOutOfStockVariant),
  };
}

export function summarizeItems(items: OrderItem[]): Map<string, { item: OrderItem; quantity: number }> {
  const summary = new Map<string, { item: OrderItem; quantity: number }>();
  for (const item of items) {
    const key = `${item.productId}|${getVariantKey(item.size, item.color)}`;
    const current = summary.get(key);
    if (current) {
      current.quantity += item.quantity;
    } else {
      summary.set(key, { item, quantity: item.quantity });
    }
  }
  return summary;
}
