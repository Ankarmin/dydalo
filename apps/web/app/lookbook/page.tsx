import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { SafeImage } from '@/components/safe-image';
import { LookbookClient } from './lookbook-client';

export const metadata: Metadata = {
  title: 'Lookbook',
  description: 'Flow sin límites. Seis historias visuales que capturan la esencia de DYDALO: sin filtros, sin poses.',
};

export default function LookbookPage() {
  return (
    <main className="page-root">
      <section className="page-hero">
        <div className="container-page">
          <p className="overline">Lookbook</p>
          <h1 className="page-hero-heading lg:text-8xl">Flow sin límites.</h1>
          <p className="hero-description">
            Una carta de amor a la calle. Historias visuales que capturan la esencia de DYDALO: sin filtros, sin poses, sin miedo.
          </p>
        </div>
      </section>
      <section className="border-y border-border section-px section-md">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-2xl font-bold italic leading-relaxed tracking-tight text-muted-foreground md:text-3xl">
            &ldquo;El estilo no es lo que llevas puesto.<br />Es cómo lo llevas.&rdquo;
          </p>
          <p className="mt-4 text-xs font-bold uppercase tracking-subhead text-accent">— Manifiesto DYDALO</p>
        </div>
      </section>
      <LookbookClient />
      <section className="border-t border-border section-px py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-4xl font-bold uppercase leading-[0.92] tracking-[-0.04em] md:text-6xl">Ahora es<br />tu turno.</p>
          <p className="mt-6 body-text">Cada look que viste es una invitación. No a copiar, sino a crear tu propia versión. El catálogo está abierto.</p>
          <Button asChild variant="hero" size="hero" className="mt-10">
            <Link href={ROUTES.catalogoAnchor}>Explorar catálogo <ArrowUpRight /></Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
