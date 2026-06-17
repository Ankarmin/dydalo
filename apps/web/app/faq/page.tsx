import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ — DYDALO',
  description: 'Sin vueltas. Respuestas directas sobre pedidos, envíos, cambios y pagos en DYDALO.',
};
import { Button } from '@/components/ui/button';
import { FaqAccordion } from './faq-accordion';

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="page-header">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link
            href="/"
            className="back-link"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </div>
      </header>

      <section className="asphalt section-px pb-8 pt-20">
        <div className="container-page">
          <p className="overline">FAQ</p>
          <h1 className="page-hero-heading">
            Sin vueltas.
          </h1>
          <p className="mt-6 max-w-xl body-text">
            Preguntas frecuentes con respuestas directas. Si no encuentras lo
            que buscas, escríbenos.
          </p>
        </div>
      </section>

      <section className="section-px py-12">
        <div className="mx-auto max-w-3xl">
          <FaqAccordion />
        </div>
      </section>

      <section className="border-t border-border section-px py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-2xl font-bold leading-relaxed tracking-tight md:text-3xl">
            ¿No encontraste lo que buscabas?
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Escríbenos y te respondemos en menos de 24h.
          </p>
          <Button variant="hero" size="hero" className="mt-8" asChild>
            <Link href="/contacto">Contacto</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
