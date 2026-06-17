import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Colaboraciones — DYDALO',
  description: 'Juntos rompemos el molde. Conoce las colaboraciones de DYDALO con artistas, marcas y festivales.',
};
import { NewsletterForm } from '@/components/newsletter-form';

const collaborations = [
  {
    id: 1,
    name: 'DYDALO × Kross',
    partner: 'Kross',
    description:
      'Colección cápsula con el grafitero barcelonés Kross. 6 piezas intervenidas a mano, cada una única. Arte usable que desafía los límites entre galería y armario.',
    status: 'PRÓXIMO',
    image: '/images/dydalo-hero.jpg',
  },
  {
    id: 2,
    name: 'DYDALO × Bassment',
    partner: 'Bassment',
    description:
      'Colaboración con el colectivo de música electrónica Bassment. Una colección que captura la energía de sus sesiones clandestinas en vinilos y texturas nocturnas.',
    status: 'PRÓXIMO',
    image: '/images/dydalo-hero.jpg',
  },
  {
    id: 3,
    name: 'DYDALO × TBD Festival',
    partner: 'TBD Festival',
    description:
      'Merch oficial del festival más crudo del sur. Disponible solo durante los tres días de evento. Piezas que no se repetirán.',
    status: 'PRÓXIMO',
    image: '/images/dydalo-hero.jpg',
  },
  {
    id: 4,
    name: 'DYDALO × La Cantera',
    partner: 'La Cantera',
    description:
      'Proyecto con el centro de talento joven La Cantera. Diseñado por y para la nueva generación del streetwear español.',
    status: 'PRÓXIMO',
    image: '/images/dydalo-hero.jpg',
  },
];

const statusStyles: Record<string, string> = {
  PRÓXIMO: 'border border-accent text-accent bg-transparent',
};

export default function ColaboracionesPage() {
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
          <p className="overline">Colaboraciones</p>
          <h1 className="page-hero-heading">
            Juntos rompemos
            <br />
            el molde.
          </h1>
          <p className="mt-6 max-w-xl body-text">
            Creemos en el poder de unir fuerzas. Cada colaboración es una
            conversación entre mundos que no deberían encontrarse, pero que al
            hacerlo crean algo irrepetible.
          </p>
        </div>
      </section>

      <section className="section-px py-16">
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-2">
            {collaborations.map((collab) => (
              <article
                key={collab.id}
                className="product-glass card-lift flex flex-col p-6"
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={collab.image}
                    alt={collab.name}
                    width={640}
                    height={360}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="size-full object-cover"
                  />
                  <span
                    className={`absolute right-3 top-3 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] ${
                      statusStyles[collab.status]
                    }`}
                  >
                    {collab.status}
                  </span>
                </div>

                <div className="mt-5 flex flex-1 flex-col">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
                    {collab.partner}
                  </p>
                  <h2 className="mt-2 text-xl font-bold uppercase tracking-tight">
                    {collab.name}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {collab.description}
                  </p>

                  <p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.15em] text-accent">
                    Próximamente — suscríbete para saber más
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border section-px py-16">
        <div className="container-page">
          <NewsletterForm id="collab-email" />
        </div>
      </section>
    </main>
  );
}
