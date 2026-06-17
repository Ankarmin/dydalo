import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nuestra Historia — EASY',
  description: 'De un sótano en Barcelona a envíos globales. La historia de EASY, la marca que nunca pidió permiso.',
};
import { Button } from '@/components/ui/button';

const timeline = [
  {
    year: '2021',
    title: 'Nace en la calle',
    description:
      'Primer drop de 50 piezas desde un sótano en Barcelona. Sin plan de negocio, sin inversores, solo hambre y un diseño que hablaba por sí mismo.',
  },
  {
    year: '2022',
    title: 'Del underground al foco',
    description:
      'Colaboraciones con artistas locales nos pusieron en el radar. La prensa especializada habló. El boca a boca hizo el resto.',
  },
  {
    year: '2024',
    title: 'The Real Cream',
    description:
      'Colecciones globales con envíos a 30 países. Manteniendo la esencia cruda de nuestros inicios en cada puntada.',
  },
  {
    year: '2026',
    title: 'Sin límites',
    description:
      'Nueva era: más categorías, más riesgos, más calle. Esto apenas empieza.',
  },
];

export default function NuestraHistoriaPage() {
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
          <p className="overline">Nuestra Historia</p>
          <h1 className="page-hero-heading lg:text-8xl">
            No nacimos.
            <br />
            Nos hicimos.
          </h1>
          <p className="mt-6 max-w-xl body-text">
            EASY no fue un plan de negocio. Fue una necesidad. La historia de
            una marca construida desde abajo, sin atajos, sin permiso.
          </p>
        </div>
      </section>

      <section className="section-px py-20">
        <div className="container-page">
          <div className="relative">
            <div className="absolute bottom-0 left-[7px] top-0 w-px bg-border" />

            <div className="flex flex-col gap-12">
              {timeline.map((item, index) => (
                <div key={item.year} className="relative flex gap-8 pl-10">
                  <span className="absolute left-0 top-0 flex size-[15px] shrink-0 -translate-x-1/2 items-center justify-center rounded-full bg-accent ring-4 ring-background" />

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold tracking-[0.22em] text-accent">
                      {item.year}
                    </span>
                    <h2 className="mt-2 text-2xl font-bold uppercase tracking-tight md:text-3xl">
                      {item.title}
                    </h2>
                    <p className="mt-3 max-w-xl body-text">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border section-px py-20">
        <div className="container-page text-center">
          <p className="text-2xl font-bold leading-relaxed tracking-tight md:text-4xl">
            &ldquo;No pedimos permiso entonces.
            <br />
            No lo pedimos ahora.&rdquo;
          </p>
          <Button asChild variant="hero" size="hero" className="mt-10">
            <Link href="/">Explorar Catálogo</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
