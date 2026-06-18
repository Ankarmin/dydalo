import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Devoluciones',
  description: 'Sin letra pequeña. 30 días para cambios y devoluciones gratis. Sin condiciones escondidas.',
};
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: '01',
    icon: '📦',
    title: 'Solicita tu cambio',
    detail: '30 días de plazo',
    description: 'Tienes un mes entero desde que recibes tu pedido para decidir. Sin prisas.',
  },
  {
    number: '02',
    icon: '📨',
    title: 'Envíalo de vuelta',
    detail: 'Sin costo de envío',
    description: 'Te enviamos una etiqueta de devolución gratuita. Solo déjalo en el punto de recogida.',
  },
  {
    number: '03',
    icon: '💵',
    title: 'Recibe tu reembolso',
    detail: 'En 5-7 días hábiles',
    description: 'En cuanto recibamos tu paquete, procesamos el reembolso. Sin preguntas, sin excusas.',
  },
];

const conditions = [
  'Prendas sin usar y con etiquetas originales.',
  'Calzado solo probado en interior.',
  'Bling y accesorios no retornables por higiene.',
  'Cambios gratis. Devoluciones gratis. Siempre.',
];

export default function DevolucionesPage() {
  return (
    <main className="page-root">

      <section className="page-hero">
        <div className="container-page">
          <p className="overline">Devoluciones</p>
          <h1 className="page-hero-heading">
            Sin letra pequeña.
          </h1>
          <p className="hero-description">
            Cambiar o devolver debería ser tan fácil como comprar. Sin
            condiciones escondidas, sin letra pequeña.
          </p>
        </div>
      </section>

      {/* ── 3 pasos ── */}
      <section className="section-px py-16">
        <div className="container-page">
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="product-glass card-lift relative p-8"
              >
                <span className="absolute right-6 top-4 text-7xl font-bold leading-none tracking-[-0.08em] text-foreground/5">
                  {step.number}
                </span>

                <div className="relative z-10">
                  <span className="text-3xl">{step.icon}</span>
                  <h3 className="mt-5 text-xl font-bold uppercase tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-accent">
                    {step.detail}
                  </p>
                  <p className="mt-3 body-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Condiciones ── */}
      <section className="border-t border-border section-px py-16">
        <div className="container-page">
          <p className="overline">Condiciones claras</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {conditions.map((condition) => (
              <div
                key={condition}
                className="flex items-start gap-3 border border-border p-4"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  ✓
                </span>
                <p className="body-sm">
                  {condition}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border section-px py-20">
        <div className="container-page text-center">
          <p className="text-2xl font-bold leading-relaxed tracking-tight md:text-4xl">
            ¿Listo?
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Escríbenos y te guiamos en el proceso.
          </p>
          <Button asChild variant="hero" size="hero" className="mt-10">
            <Link href={ROUTES.contacto}>
              Iniciar devolución <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
