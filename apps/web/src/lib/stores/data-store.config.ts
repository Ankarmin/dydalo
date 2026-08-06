import { read, write, generateId, KEYS } from "./data-store.utils";
import type { SiteConfig } from "./data-store.types";

const DEFAULT_CONFIG: SiteConfig = {
  id: "default",
  siteName: "DYDALO",
  siteDescription: "Streetwear premium y exclusivo para un flow sin límites.",
  brandSubtitle: "The Real Cream",
  contactEmail: "contacto@dydalo.com",
  contactPhone: "",
  address: "",
  socialLinks: {},
  shippingInfo: "## Envíos\n\n**Lima Metropolitana:** Envío gratis en todos los pedidos. Entrega en 2-3 días hábiles.\n\n**Provincia:** Envíos vía Olva desde S/ 15. Entrega en 5-12 días hábiles. El costo varía según peso y destino.",
  returnPolicy: "## Devoluciones\n\nPolítica de devoluciones próximamente.",
  sizeGuide: "## Guía de Tallas\n\nGuía de tallas próximamente.",
  faq: [
    { question: "¿Cómo realizo un pedido?", answer: "Próximamente disponible." },
    { question: "¿Cuánto tarda el envío?", answer: "Próximamente disponible." },
  ],
  heroSettings: {
    title: "THE REAL CREAM",
    subtitle: "Descubre la nueva colección",
    ctaText: "VER CATÁLOGO",
    ctaLink: "/catalogo",
    backgroundImage: "/images/dydalo-hero-negro.webp",
  },
  maintenanceMode: false,
};

function get(): SiteConfig {
  const stored = read<SiteConfig>(KEYS.config, DEFAULT_CONFIG);
  return { ...DEFAULT_CONFIG, ...stored, id: stored.id || DEFAULT_CONFIG.id };
}

function update(data: Partial<SiteConfig>): SiteConfig {
  const current = get();
  const updated: SiteConfig = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  write(KEYS.config, updated);
  return updated;
}

function reset(): SiteConfig {
  write(KEYS.config, DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

export const configStore = { get, update, reset };
