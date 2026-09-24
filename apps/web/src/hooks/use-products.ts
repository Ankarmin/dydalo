"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { productsStore } from "@/lib/stores/data-store.products";
import { seedIfEmpty } from "@/config/seed-data";
import type { AdminProduct } from "@/lib/stores/data-store.types";
import { isApiEnabled } from "@/lib/api/client";
import {
  apiGetProductsCached,
  clearProductsCache,
  getCachedProducts,
  subscribeProducts,
} from "@/lib/api/catalog";

function localProducts(): AdminProduct[] {
  if (typeof window === "undefined") return [];
  seedIfEmpty();
  return productsStore.getAll();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useProducts() {
  // Inicial SSR-seguro: [] en servidor y en primer render cliente (la lista
  // local solo existe en el navegador; pintarla directo rompe la hidratación).
  const [products, setProducts] = useState<AdminProduct[]>(() => getCachedProducts() ?? []);
  const [loaded, setLoaded] = useState(() => !isApiEnabled() || getCachedProducts() !== null);
  // remoteOk: true solo si la lista activa vino del backend. En modo mock lo
  // local ES la fuente (siempre true). Sin esta señal, un fetch fallido deja
  // a la UI operando con ids provisorios que el backend rechaza al pagar.
  const [remoteOk, setRemoteOk] = useState(() => !isApiEnabled() || getCachedProducts() !== null);
  const [retryTick, setRetryTick] = useState(0);
  const remoteOkRef = useRef(remoteOk);
  useEffect(() => {
    remoteOkRef.current = remoteOk;
  });

  const retry = useCallback(() => {
    clearProductsCache();
    setRetryTick((tick) => tick + 1);
  }, []);
  const didInitLocal = useRef(false);

  useEffect(() => {
    function refreshLocal() {
      if (!isApiEnabled()) setProducts(productsStore.getAll());
    }
    if (typeof window !== "undefined") {
      window.addEventListener("storage", refreshLocal);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", refreshLocal);
      }
    };
  }, []);

  useEffect(() => {
    // Hidratación solo-cliente desde localStorage (una vez): el SSR queda en
    // [] para hidratar idéntico y el efecto puebla sin parpadeo de error.
    if (!didInitLocal.current) {
      didInitLocal.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- populate inicial cliente post-hidratación, no suscripción reactiva
      if (!getCachedProducts()) setProducts(localProducts());
    }
    // En mock remoteOk inicial ya es true; con caché tibia el inicializador
    // y la suscripción adoptan sin sets síncronos (el lint los prohíbe).
    if (!isApiEnabled()) return;
    let alive = true;
    // Vía API con reintentos: un arranque escalonado (API fría) no debe dejar
    // la sesión entera en datos provisorios. El vuelo se comparte entre
    // instancias vía apiGetProductsCached.
    const delays = [0, 1500, 4000];
    (async () => {
      for (const delay of delays) {
        if (delay > 0) await sleep(delay);
        if (!alive) return;
        try {
          const list = await apiGetProductsCached();
          if (!alive) return;
          setProducts(list);
          setRemoteOk(true);
          setLoaded(true);
          return;
        } catch {
          // Siguiente intento (o fallback local definitivo al agotarlos).
        }
      }
      if (alive) setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, [retryTick]);

  // Llegar tarde también vale: si seguimos en fallback, revalidar al
  // recuperar red o foco (cualquier éxito notifica a TODAS las instancias).
  useEffect(() => {
    if (typeof window === "undefined" || !isApiEnabled()) return;
    function handleReconnect() {
      if (remoteOkRef.current) return;
      retry();
    }
    window.addEventListener("online", handleReconnect);
    window.addEventListener("focus", handleReconnect);
    return () => {
      window.removeEventListener("online", handleReconnect);
      window.removeEventListener("focus", handleReconnect);
    };
  }, [retry]);

  useEffect(() => subscribeProducts((list) => {
    setProducts(list);
    setRemoteOk(true);
    setLoaded(true);
  }), []);

  const getById = useCallback((id: string) => products.find((p) => p.id === id) ?? null, [products]);

  return {
    products,
    loaded,
    remoteOk,
    retry,
    activeProducts: products.filter((p) => p.active),
    featuredProducts: products.filter((p) => p.featured && p.active),
    getById,
  };
}
