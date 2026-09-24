"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useProducts } from "@/hooks/use-products";
import { isApiEnabled } from "@/lib/api/client";
import { getDisplayPrice } from "@/lib/utils/format";
import type { AdminProduct } from "@/lib/stores/data-store.types";
import { getVariantKey, getVariantStock } from "@/lib/utils/inventory";

export type CartItem = {
  key: string;
  productId: string;
  // Slug para reconciliar cuando la lista cambia (swap local↔API): los ids
  // mock ("1".."80") y los cuid del backend conviven según la fuente activa.
  productSlug?: string;
  size: string;
  color: string;
  quantity: number;
};

type CartState = Record<string, CartItem>;

type StoredCart = {
  version: 2;
  items: CartItem[];
};

export type CartLine = CartItem & {
  product: AdminProduct;
};

type CartContextValue = {
  cart: CartState;
  cartCount: number;
  cartProducts: AdminProduct[];
  cartItems: CartLine[];
  subtotal: number;
  // En modo API es false mientras el catálogo no venga del backend: la UI
  // debe bloquear el pago (los ids provisorios el backend los rechaza).
  catalogLive: boolean;
  retryCatalog: () => void;
  updateQuantity: (productId: string, change: number, variant?: { size?: string; color?: string; productSlug?: string }) => boolean;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = "dydalo-cart";

function isStoredCart(value: unknown): value is StoredCart {
  if (typeof value !== "object" || value === null) return false;
  const version = (value as { version?: unknown }).version;
  // v1 legacy (sin slug) se sigue aceptando: resuelve solo por id.
  return (
    (version === 2 || version === 1) &&
    Array.isArray((value as StoredCart).items)
  );
}

type ProductLookup = (id: string, slug?: string) => AdminProduct | null;

function sanitizeCartItems(
  items: unknown[],
  getById: ProductLookup,
): CartState {
  const next: CartState = {};

  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;

    const { productId, productSlug, size, color, quantity } = item as Partial<CartItem>;
    if (
      typeof productId !== "string" ||
      typeof size !== "string" ||
      typeof color !== "string" ||
      typeof quantity !== "number"
    ) {
      continue;
    }

    const product = getById(productId, typeof productSlug === "string" ? productSlug : undefined);
    if (!product?.active) continue;

    const maxStock = getVariantStock(product, size, color);
    if (maxStock <= 0) continue;

    const normalizedQuantity = Math.min(maxStock, Math.max(1, Math.trunc(quantity)));
    // Clave autocurativa: si resolvió por slug, el id cambió (swap de fuente).
    const key = `${product.id}|${getVariantKey(size, color)}`;
    next[key] = { key, productId: product.id, productSlug: product.slug, size, color, quantity: normalizedQuantity };
  }

  return next;
}

function loadStoredItems(): unknown[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!isStoredCart(parsed)) return [];

    return parsed.items;
  } catch {
    return [];
  }
}

function saveCart(cart: CartState): void {
  if (typeof window === "undefined") return;

  try {
    const items = Object.values(cart);
    if (items.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 2, items } satisfies StoredCart));
  } catch {

  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>({});
  const [hydrated, setHydrated] = useState(false);
  // Misma fuente que la UI (API primero, fallback local): sin esto los ids
  // cuid del backend no resuelven y el agregado se ignora en silencio.
  const { products, loaded: productsLoaded, remoteOk, retry } = useProducts();
  const apiMode = isApiEnabled();
  // En modo API solo la lista del backend es autoridad: hidratar o contar con
  // el fallback local crearía ids fantasmas que el backend rechaza al pagar.
  const catalogLive = !apiMode || remoteOk;
  const productMaps = useMemo(
    () => ({
      byId: new Map(products.map((p) => [p.id, p])),
      bySlug: new Map(products.map((p) => [p.slug, p])),
    }),
    [products],
  );
  const getById: ProductLookup = useCallback(
    (id, slug) =>
      productMaps.byId.get(id) ?? (slug ? productMaps.bySlug.get(slug) ?? null : null),
    [productMaps],
  );
  // Ref espejo para decidir el resultado de updateQuantity de forma síncrona
  // (el updater de setState corre diferido y no puede devolver valores).
  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  });

  useEffect(() => {
    if (!productsLoaded || !catalogLive || hydrated) return;
    queueMicrotask(() => {
      setCart((current) => {
        if (Object.keys(current).length === 0) {
          return sanitizeCartItems(loadStoredItems(), getById);
        }
        // Fusión: lo guardado rellena, lo actual gana (intención más fresca).
        // sanitize re-cura claves por slug ante un swap de fuente.
        return sanitizeCartItems([...loadStoredItems(), ...Object.values(current)], getById);
      });
      setHydrated(true);
    });
  }, [productsLoaded, catalogLive, hydrated, getById]);

  useEffect(() => {
    if (!hydrated) return;
    saveCart(cart);
  }, [cart, hydrated]);

  const updateQuantity = useCallback((productId: string, change: number, variant?: { size?: string; color?: string; productSlug?: string }) => {
    const product = getById(productId, variant?.productSlug);
    if (!product) return false;

    const size = variant?.size ?? product.sizes[0] ?? "Única";
    const color = variant?.color ?? product.colors[0]?.name ?? "Negro";
    // Self-heal: si resolvió por slug, el id cambió (swap local↔API).
    const resolvedId = product.id;
    const key = `${resolvedId}|${getVariantKey(size, color)}`;
    const maxStock = getVariantStock(product, size, color);
    const currentQty = cartRef.current[key]?.quantity ?? 0;
    const nextQuantity = Math.min(maxStock, currentQty + change);

    if (nextQuantity <= 0) {
      if (currentQty <= 0) return false;
      setCart((current) => {
        if (!(key in current)) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
      return true;
    }
    if (change > 0 && nextQuantity <= currentQty) return false;
    setCart((current) => ({
      ...current,
      [key]: { key, productId: resolvedId, productSlug: product.slug, size, color, quantity: nextQuantity },
    }));
    return true;
  }, [getById]);

  const clearCart = useCallback(() => {
    setCart({});
  }, []);

  const cartItems = useMemo(
    () =>
      Object.values(cart)
        .map((item) => {
          const product = getById(item.productId, item.productSlug);
          return product ? { ...item, product } : null;
        })
        .filter((item): item is CartLine => item !== null),
    [cart, getById],
  );

  // Conteo sobre líneas resueltas: en estados asentados coincide con el crudo;
  // en transición (swap de fuente) no muestra fantasmas no comprables.
  const cartCount = useMemo(
    () => cartItems.reduce((t, item) => t + item.quantity, 0),
    [cartItems],
  );

  const cartProducts = useMemo(
    () => cartItems.map((item) => item.product),
    [cartItems],
  );

  const subtotal = useMemo(
    () =>
      cartItems.reduce((t, item) => {
        const { final } = getDisplayPrice(item.product);
        return t + final * item.quantity;
      }, 0),
    [cartItems],
  );

  return (
    <CartContext.Provider
      value={{ cart, cartCount, cartProducts, cartItems, subtotal, catalogLive, retryCatalog: retry, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
