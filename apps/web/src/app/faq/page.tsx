import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Sin vueltas. Respuestas directas sobre pedidos, envíos, cambios y pagos en DYDALO.',
};
import { ROUTES } from '@/lib/utils/routes';
import { Button } from '@/components/ui/button';
import { FaqAccordion } from './faq-accordion';

export default function FaqPage() {
  return (
    <main className="page-root">

      <section className="page-hero">
        <div className="container-page">
          <p className="section-tag">FAQ</p>
          <h1 className="page-hero-heading">
            Sin vueltas.
          </h1>
          <p className="hero-description">
            Preguntas frecuentes con respuestas directas. Si no encuentras lo
            que buscas, escríbenos.
          </p>
        </div>
      </section>

      <section className="section-px section-sm">
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
            <Link href={ROUTES.contacto}>Contacto</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
