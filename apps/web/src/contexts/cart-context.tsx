"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import { productsStore } from "@/lib/stores/data-store.products";
import { getDisplayPrice } from "@/lib/utils/format";
import type { AdminProduct } from "@/lib/stores/data-store.types";
import { getVariantKey, getVariantStock } from "@/lib/utils/inventory";

export type CartItem = {
  key: string;
  productId: string;
  size: string;
  color: string;
  quantity: number;
};

type CartState = Record<string, CartItem>;

type StoredCart = {
  version: 1;
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
  updateQuantity: (productId: string, change: number, variant?: { size?: string; color?: string }) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = "dydalo-cart";

function isStoredCart(value: unknown): value is StoredCart {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as StoredCart).version === 1 &&
    Array.isArray((value as StoredCart).items)
  );
}

function sanitizeCartItems(items: unknown[]): CartState {
  const next: CartState = {};

  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;

    const { productId, size, color, quantity } = item as Partial<CartItem>;
    if (
      typeof productId !== "string" ||
      typeof size !== "string" ||
      typeof color !== "string" ||
      typeof quantity !== "number"
    ) {
      continue;
    }

    const product = productsStore.getById(productId);
    if (!product?.active) continue;

    const maxStock = getVariantStock(product, size, color);
    if (maxStock <= 0) continue;

    const normalizedQuantity = Math.min(maxStock, Math.max(1, Math.trunc(quantity)));
    const key = `${productId}|${getVariantKey(size, color)}`;
    next[key] = { key, productId, size, color, quantity: normalizedQuantity };
  }

  return next;
}

function loadCart(): CartState {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!isStoredCart(parsed)) return {};

    return sanitizeCartItems(parsed.items);
  } catch {
    return {};
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

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items } satisfies StoredCart));
  } catch {

  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setCart(loadCart());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCart(cart);
  }, [cart, hydrated]);

  const updateQuantity = useCallback((productId: string, change: number, variant?: { size?: string; color?: string }) => {
    setCart((current) => {
      const product = productsStore.getById(productId);
      if (!product) return current;

      const size = variant?.size ?? product.sizes[0] ?? "Única";
      const color = variant?.color ?? product.colors[0]?.name ?? "Negro";
      const key = `${productId}|${getVariantKey(size, color)}`;
      const maxStock = getVariantStock(product, size, color);
      const nextQuantity = Math.min(maxStock, (current[key]?.quantity ?? 0) + change);

      if (nextQuantity <= 0) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return {
        ...current,
        [key]: { key, productId, size, color, quantity: nextQuantity },
      };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
  }, []);

  const cartCount = useMemo(
    () => Object.values(cart).reduce((t, item) => t + item.quantity, 0),
    [cart],
  );

  const cartItems = useMemo(
    () =>
      Object.values(cart)
        .map((item) => {
          const product = productsStore.getById(item.productId);
          return product ? { ...item, product } : null;
        })
        .filter((item): item is CartLine => item !== null),
    [cart],
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
      value={{ cart, cartCount, cartProducts, cartItems, subtotal, updateQuantity, clearCart }}
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
