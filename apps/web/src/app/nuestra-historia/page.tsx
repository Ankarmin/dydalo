import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nuestra Historia',
  description: "De un sótano en Barcelona al streetwear nacional. La historia de DYDALO, la marca que nunca pidió permiso.",
};
import { ROUTES } from '@/lib/utils/routes';
import { Button } from '@/components/ui/button';
import { PageBreadcrumbs } from '@/components/breadcrumbs/page-breadcrumbs';

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
      "Colecciones nacionales manteniendo la esencia cruda de nuestros inicios en cada puntada.",
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
    <main className="page-root">
      <section className="page-hero">
        <div className="container-page">
          <PageBreadcrumbs
            className="mb-4"
            items={[
              { label: "Inicio", href: ROUTES.home },
              { label: "Nuestra historia" },
            ]}
          />
          <h1 className="page-hero-heading lg:text-8xl">
            No nacimos.
            <br />
            Nos hicimos.
          </h1>
          <p className="hero-description">
            DYDALO no fue un plan de negocio. Fue una necesidad. La historia de
            una marca construida desde abajo, sin atajos, sin permiso.
          </p>
        </div>
      </section>

      <section className="section-px section-lg">
        <div className="container-page">
          <div className="relative">
            <div className="absolute bottom-0 left-[7px] top-0 w-px bg-border" />

            <div className="flex flex-col gap-12">
              {timeline.map((item) => (
                <div key={item.year} className="relative flex gap-4 pl-8 sm:gap-8 sm:pl-10">
                  <span className="absolute left-0 top-0 flex size-[15px] shrink-0 -translate-x-1/2 items-center justify-center rounded-full bg-accent ring-4 ring-background" />

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold tracking-subhead text-accent">
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

      <section className="border-t border-border section-px section-lg">
        <div className="container-page text-center">
          <p className="text-2xl font-bold leading-relaxed tracking-tight md:text-4xl">
            &ldquo;No pedimos permiso entonces.
            <br />
            No lo pedimos ahora.&rdquo;
          </p>
          <Button asChild variant="hero" size="hero" className="mt-10">
            <Link href={ROUTES.home}>Explorar Catálogo</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
