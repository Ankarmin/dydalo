"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { products } from "@/data/products";

type CartState = Record<number, number>;

type CartContextValue = {
  cart: CartState;
  cartCount: number;
  cartProducts: typeof products;
  subtotal: number;
  updateQuantity: (productId: number, change: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>({});

  const updateQuantity = useCallback((productId: number, change: number) => {
    setCart((current) => {
      const nextQuantity = (current[productId] ?? 0) + change;
      if (nextQuantity <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: nextQuantity };
    });
  }, []);

  const cartCount = useMemo(
    () => Object.values(cart).reduce((t, q) => t + q, 0),
    [cart],
  );

  const cartProducts = useMemo(
    () => products.filter((p) => cart[p.id]),
    [cart],
  );

  const subtotal = useMemo(
    () =>
      cartProducts.reduce((t, p) => t + p.price * (cart[p.id] ?? 0), 0),
    [cartProducts, cart],
  );

  return (
    <CartContext.Provider
      value={{ cart, cartCount, cartProducts, subtotal, updateQuantity }}
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
