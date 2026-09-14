"use client";

import { useState, useEffect } from "react";
import { configStore } from "@/lib/stores/data-store.config";
import type { SiteConfig } from "@/lib/stores/data-store.types";
import { isApiEnabled } from "@/lib/api/client";
import { apiGetSiteConfig } from "@/lib/api/catalog";

const defaultConfig: SiteConfig = {
  id: "default",
  siteName: "DYDALO",
  siteDescription: "Streetwear premium y exclusivo para un flow sin límites.",
  brandSubtitle: "The Real Cream",
  contactEmail: "",
  contactPhone: "",
  address: "",
  socialLinks: {},
  shippingInfo: "**Lima por aplicativo:** Lo pagas al conductor al recibir (desde S/ 10 aprox).\n\n**Provincia vía Olva:** Desde S/ 15. El costo final se confirma por WhatsApp.\n\n**Recojo en oficina:** Gratis, según disponibilidad.",
  returnPolicy: "",
  sizeGuide: "",
  faq: [],
  heroSettings: { title: "THE REAL CREAM", subtitle: "UNDERGROUND STREETWEAR", ctaText: "VER CATÁLOGO", ctaLink: "/catalogo", backgroundImage: "/images/dydalo-panoramica.png" },
  maintenanceMode: false,
};

function localConfig(): SiteConfig {
  if (typeof window === "undefined") return defaultConfig;
  return configStore.get();
}

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(() => localConfig());

  useEffect(() => {
    function refreshLocal() {
      if (!isApiEnabled()) setConfig(configStore.get());
    }
    if (typeof window !== "undefined") {
      window.addEventListener("storage", refreshLocal);
    }

    let alive = true;
    if (isApiEnabled()) {
      apiGetSiteConfig()
        .then((remote) => {
          if (alive) setConfig(remote);
        })
        .catch(() => {});
    }
    return () => {
      alive = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", refreshLocal);
      }
    };
  }, []);

  return config;
}
