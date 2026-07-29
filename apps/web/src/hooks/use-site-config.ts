"use client";

import { useSyncExternalStore } from "react";
import { configStore } from "@/lib/stores/data-store.config";
import type { SiteConfig } from "@/lib/stores/data-store.types";

const defaultConfig: SiteConfig = {
  siteName: "DYDALO",
  siteDescription: "Streetwear premium y exclusivo para un flow sin límites.",
  brandSubtitle: "The Real Cream",
  contactEmail: "",
  contactPhone: "",
  address: "",
  socialLinks: {},
  shippingInfo: "**Lima Metropolitana:** Envío gratis. 2-3 días hábiles.\n\n**Provincia:** Envíos vía Olva desde S/ 15. 5-12 días hábiles.",
  returnPolicy: "",
  sizeGuide: "",
  faq: [],
  heroSettings: { title: "THE REAL CREAM", subtitle: "UNDERGROUND STREETWEAR", ctaText: "VER CATÁLOGO", ctaLink: "/catalogo", backgroundImage: "/images/dydalo-hero-negro.webp" },
  maintenanceMode: false,
};

let cachedConfig: SiteConfig | null = null;

function invalidateCache() {
  cachedConfig = null;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
    invalidateCache();
  };
}

function getSnapshot(): SiteConfig {
  if (typeof window === "undefined") return defaultConfig;
  if (cachedConfig) return cachedConfig;
  cachedConfig = configStore.get();
  return cachedConfig;
}

function getServerSnapshot(): SiteConfig {
  return defaultConfig;
}

export function useSiteConfig() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
