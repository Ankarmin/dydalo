import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, MapPin, Truck, Search, Package } from "lucide-react";
import { SHIPPING_PROVINCIA_PRICE, SHIPPING_PROVINCIA_COURIER } from "@/config/constants";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";

export const metadata: Metadata = {
  title: "Envíos",
  description:
    `Envíos gratis en Lima Metropolitana. Envíos a provincia vía ${SHIPPING_PROVINCIA_COURIER} desde S/ ${SHIPPING_PROVINCIA_PRICE}. Conoce tiempos de entrega y tarifas.`,
};

const steps = [
  {
    step: 1,
    icon: Search,
    title: "Pedido Confirmado",
    description: "Procesamos tu pedido en 24 horas.",
  },
  {
    step: 2,
    icon: Package,
    title: "Empaquetado",
    description: "Preparamos tu pedido con protección y seguridad.",
  },
  {
    step: 3,
    icon: Truck,
    title: "En Ruta",
    description: `Recibirás tu número de tracking por email. Envíos a provincia vía ${SHIPPING_PROVINCIA_COURIER}.`,
  },
  {
    step: 4,
    icon: MapPin,
    title: "Entregado",
    description: "En tu puerta. Sin excusas, sin demoras.",
  },
];

const rates = [
  {
    icon: MapPin,
    name: "Lima Metropolitana",
    price: "GRATIS",
    time: "2-3 días hábiles",
    detail: "Envío sin costo en todos los pedidos dentro de Lima Metropolitana. Entrega rápida y segura directamente a tu puerta.",
  },
  {
    icon: Truck,
    name: "Provincia",
    price: `S/ ${SHIPPING_PROVINCIA_PRICE} — S/ 25`,
    time: "5-12 días hábiles",
    detail: `Envíos a todo el Perú vía ${SHIPPING_PROVINCIA_COURIER}. El costo varía según peso y destino y es asumido por el cliente. Recibirás el tracking de ${SHIPPING_PROVINCIA_COURIER} por email.`,
  },
];

export default function EnviosPage() {
  return (
    <main className="page-root">
      <section className="page-hero">
        <div className="container-page">
          <PageBreadcrumbs
            className="mb-4"
            items={[
              { label: "Home", href: ROUTES.home },
              { label: "Envíos" },
            ]}
          />
          <h1 className="page-hero-heading">
            De Lima a todo el Perú.
          </h1>
          <p className="hero-description">
            Envíos gratis en Lima Metropolitana. Para provincia, coordinamos con{" "}
            {SHIPPING_PROVINCIA_COURIER} para que tu pedido llegue seguro.
          </p>
        </div>
      </section>

      <section className="border-t border-border section-px section-md">
        <div className="container-page">
          <p className="section-tag">Tarifas</p>
          <h2 className="mt-2 text-3xl font-bold uppercase tracking-tight md:text-4xl">
            Lo que cuesta llegar.
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {rates.map((rate) => (
              <div
                key={rate.name}
                className="product-glass card-lift p-6"
              >
                <rate.icon className="size-8 text-accent" />
                <h3 className="mt-4 text-lg font-bold uppercase tracking-tight">
                  {rate.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{rate.price}</span>
                  <span className="text-xs text-muted-foreground">
                    / {rate.time}
                  </span>
                </div>
                <p className="mt-2 body-sm">{rate.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border section-px section-md">
        <div className="container-page">
          <div className="relative">
            <div className="absolute left-7 top-0 h-full w-0.5 bg-accent md:hidden" />
            <div className="absolute left-0 right-0 top-14 hidden h-0.5 bg-accent md:block" />

            <div className="grid gap-8 md:grid-cols-4">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className="relative flex items-start gap-4 md:flex-col md:items-center md:text-center"
                >
                  <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
                    <item.icon className="size-5" />
                  </span>
                  <div className="md:text-center">
                    <h3 className="text-lg font-bold uppercase tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-1 body-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border section-px section-lg">
        <div className="container-page text-center">
          <p className="text-2xl font-bold leading-relaxed tracking-tight md:text-4xl">
            ¿Listo para tu pedido?
          </p>
          <Button asChild variant="hero" size="hero" className="mt-10">
            <Link href={ROUTES.catalogo}>
              Ir al catálogo <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
