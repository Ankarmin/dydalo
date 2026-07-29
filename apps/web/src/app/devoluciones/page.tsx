import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight, Package, Mail, BadgeDollarSign, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Devoluciones',
  description: 'Sin letra pequeña. 30 días para cambios y devoluciones gratis. Sin condiciones escondidas.',
};
import { ROUTES } from '@/lib/utils/routes';
import { Button } from '@/components/ui/button';
import { PageBreadcrumbs } from '@/components/breadcrumbs/page-breadcrumbs';

const steps = [
  {
    number: '01',
    Icon: Package,
    title: 'Solicita tu cambio',
    detail: '30 días de plazo',
    description: 'Tienes un mes entero desde que recibes tu pedido para decidir. Sin prisas.',
  },
  {
    number: '02',
    Icon: Mail,
    title: 'Envíalo de vuelta',
    detail: 'Sin costo de envío',
    description: 'Te enviamos una etiqueta de devolución gratuita. Solo déjalo en el punto de recogida.',
  },
  {
    number: '03',
    Icon: BadgeDollarSign,
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
          <PageBreadcrumbs
            className="mb-4"
            items={[
              { label: "Home", href: ROUTES.home },
              { label: "Devoluciones" },
            ]}
          />
          <h1 className="page-hero-heading">
            Sin letra pequeña.
          </h1>
          <p className="hero-description">
            Cambiar o devolver debería ser tan fácil como comprar. Sin
            condiciones escondidas, sin letra pequeña.
          </p>
        </div>
      </section>

      
      <section className="section-px section-md">
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
                  <step.Icon className="size-8 text-accent" />
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

      
      <section className="border-t border-border section-px section-md">
        <div className="container-page">
          <p className="section-tag">Condiciones claras</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {conditions.map((condition) => (
              <div
                key={condition}
                className="flex items-start gap-3 border border-border p-4"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                <p className="body-sm">
                  {condition}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section className="border-t border-border section-px section-lg">
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
