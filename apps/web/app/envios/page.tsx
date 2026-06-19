import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Envíos',
  description: 'De la calle a tu casa. Express, estándar e internacional. Envíos gratis en pedidos superiores a $150.',
};
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';

const steps = [
  {
    step: 1,
    title: 'Pedido',
    description: 'Procesamos tu pedido en 24h.',
  },
  {
    step: 2,
    title: 'Preparado',
    description: 'Tu pedido está siendo preparado con cuidado.',
  },
  {
    step: 3,
    title: 'En ruta',
    description: 'Sigue tu envío en tiempo real con tu número de tracking.',
  },
  {
    step: 4,
    title: 'Entregado',
    description: 'En tu puerta. Sin excusas, sin demoras.',
  },
];

const rates = [
  {
    icon: '🚀',
    name: 'Express',
    time: '1-2 días',
    price: '$12',
    detail: 'Entrega prioritaria con seguimiento en tiempo real.',
  },
  {
    icon: '📦',
    name: 'Estándar',
    time: '3-5 días',
    price: '$5',
    detail: 'Gratis en pedidos superiores a $150.',
  },
  {
    icon: '🌍',
    name: 'Internacional',
    time: '7-14 días',
    price: '$20',
    detail: 'Envíos a más de 30 países. Aduanas no incluidas.',
  },
];

export default function EnviosPage() {
  return (
    <main className="page-root">

      <section className="page-hero">
        <div className="container-page">
          <p className="overline">Envíos</p>
          <h1 className="page-hero-heading">
            De la calle a tu casa.
          </h1>
          <p className="hero-description">
            Cada pedido es un viaje. Desde que haces clic hasta que abres la
            caja, esto es lo que pasa.
          </p>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="section-px section-md">
        <div className="container-page">
          <div className="relative">
            {/* Línea conectora */}
            <div className="absolute left-7 top-0 h-full w-0.5 bg-accent md:hidden" />
            <div className="absolute left-0 right-0 top-14 hidden h-0.5 bg-accent md:block" />

            <div className="grid gap-8 md:grid-cols-4">
              {steps.map((item) => (
                <div key={item.step} className="relative flex items-start gap-4 md:flex-col md:items-center md:text-center">
                  <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
                    {item.step}
                  </span>
                  <div className="md:text-center">
                    <h3 className="text-lg font-bold uppercase tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-1 body-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tarifas ── */}
      <section className="border-t border-border section-px section-md">
        <div className="container-page">
          <p className="overline">Tarifas</p>
          <h2 className="mt-2 text-3xl font-bold uppercase tracking-tight md:text-4xl">
            Lo que cuesta llegar.
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {rates.map((rate) => (
              <div
                key={rate.name}
                className="product-glass card-lift p-6"
              >
                <span className="text-2xl">{rate.icon}</span>
                <h3 className="mt-4 text-lg font-bold uppercase tracking-tight">
                  {rate.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{rate.price}</span>
                  <span className="text-xs text-muted-foreground">
                    / {rate.time}
                  </span>
                </div>
                <p className="mt-2 body-sm">
                  {rate.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 inline-block border border-accent bg-accent/10 px-5 py-3">
            <p className="text-sm font-bold uppercase tracking-wide text-accent">
              Envíos gratis en pedidos superiores a $150
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border section-px section-lg">
        <div className="container-page text-center">
          <p className="text-2xl font-bold leading-relaxed tracking-tight md:text-4xl">
            ¿Listo para tu próximo envío?
          </p>
          <Button asChild variant="hero" size="hero" className="mt-10">
            <Link href={ROUTES.catalogoAnchor}>
              Ir al catálogo <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
