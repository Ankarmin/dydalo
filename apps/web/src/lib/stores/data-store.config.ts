import { read, write, KEYS } from "./data-store.utils";
import type { SiteConfig } from "./data-store.types";

const DEFAULT_CONFIG: SiteConfig = {
  siteName: "DYDALO",
  siteDescription: "Streetwear premium y exclusivo para un flow sin límites.",
  brandSubtitle: "The Real Cream",
  contactEmail: "contacto@dydalo.com",
  contactPhone: "",
  address: "",
  socialLinks: {},
  shippingInfo: "## Envíos\n\nInformación sobre envíos próximamente.",
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
  return read<SiteConfig>(KEYS.config, DEFAULT_CONFIG);
}

function update(data: Partial<SiteConfig>): SiteConfig {
  const current = get();
  const updated: SiteConfig = { ...current, ...data };
  write(KEYS.config, updated);
  return updated;
}

function reset(): SiteConfig {
  write(KEYS.config, DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

export const configStore = { get, update, reset };
