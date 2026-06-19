import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Lookbook',
  description: 'Flow sin límites. Seis historias visuales que capturan la esencia de DYDALO: sin filtros, sin poses.',
};
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { SafeImage } from '@/components/safe-image';

const spreads = [
  {
    id: 1,
    src: '/images/dydalo-tracksuit.jpg',
    alt: 'Midnight Track Set en entorno urbano nocturno',
    number: '01',
    title: 'La noche es nuestra',
    category: 'Ropa',
    description:
      'Siluetas limpias, tejidos pesados y una actitud que no pide permiso. El Midnight Track Set redefine el uniforme nocturno con precisión quirúrgica.',
  },
  {
    id: 2,
    src: '/images/dydalo-satin-set.jpg',
    alt: 'Liquid Black Uniform en rooftop',
    number: '02',
    title: 'Líquido y letal',
    category: 'Ropa',
    description:
      'El satén se encuentra con el asfalto. Liquid Black Uniform fluye entre la elegancia y la crudeza, recordándonos que el lujo también nace en la calle.',
  },
  {
    id: 3,
    src: '/images/dydalo-white-basics.jpg',
    alt: 'Pure Form Set en estudio minimalista',
    number: '03',
    title: 'Menos es el mensaje',
    category: 'Ropa',
    description:
      'Blanco puro. Sin distracciones. Pure Form Set es el lienzo perfecto para quien entiende que el estilo no necesita ruido para hacerse oír.',
  },
  {
    id: 4,
    src: '/images/dydalo-caps.jpg',
    alt: 'Two Tone Caps en la calle',
    number: '04',
    title: 'Corona sin reino',
    category: 'Accesorios',
    description:
      'Una gorra no tapa, revela. Two Tone Caps es el remate que separa un fit genérico de una declaración de principios.',
  },
  {
    id: 5,
    src: '/images/dydalo-bling.jpg',
    alt: 'Cold Cuban Ice detalle editorial',
    number: '05',
    title: 'Peso y presencia',
    category: 'Bling',
    description:
      'El brillo no es vanidad, es lenguaje. Cold Cuban Ice habla en destellos. Cada eslabón, una sílaba. Cada dije, una historia.',
  },
  {
    id: 6,
    src: '/images/dydalo-sneakers.jpg',
    alt: 'Night Court High en movimiento',
    number: '06',
    title: 'Suelo firme',
    category: 'Calzado',
    description:
      'Pisan donde otros dudan. Las Night Court High llevan en su ADN la herencia del basket y la urgencia de la calle.',
  },
];

export default function LookbookPage() {
  return (
    <main className="page-root">

      <section className="page-hero">
        <div className="container-page">
          <p className="overline">Lookbook</p>
          <h1 className="page-hero-heading lg:text-8xl">
            Flow sin límites.
          </h1>
          <p className="hero-description">
            Una carta de amor a la calle. Seis historias visuales que capturan
            la esencia de DYDALO: sin filtros, sin poses, sin miedo.
          </p>
        </div>
      </section>

      <section className="border-y border-border section-px section-md">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-2xl font-bold italic leading-relaxed tracking-tight text-muted-foreground md:text-3xl">
            &ldquo;El estilo no es lo que llevas puesto.
            <br />
            Es cómo lo llevas.&rdquo;
          </p>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-accent">
            — Manifiesto DYDALO
          </p>
        </div>
      </section>

      {spreads.map((spread, index) => {
        const isEven = index % 2 === 0;

        return (
          <section
            key={spread.id}
            className={`section-px ${
              index === spreads.length - 1 ? 'pb-16 md:pb-24' : ''
            } ${index === 0 ? 'pt-16 md:pt-20' : 'pt-20 md:pt-28'}`}
          >
            <div className="container-page">
              <div
                className={`flex flex-col gap-10 ${
                  isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } lg:items-center`}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden lg:w-[55%]">
                  <SafeImage
                    src={spread.src}
                    alt={spread.alt}
                    width={800}
                    height={1000}
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="size-full object-cover"
                  />
                </div>

                <div className="lg:w-[45%]">
                  <span className="text-6xl font-bold leading-none tracking-[-0.08em] text-foreground/10 sm:text-7xl md:text-8xl lg:text-9xl">
                    {spread.number}
                  </span>

                  <div className="-mt-4 md:-mt-6">
                    <p className="text-xs font-bold tracking-[0.22em] text-accent">
                      {spread.category}
                    </p>
                    <h2 className="mt-3 text-3xl font-bold uppercase leading-[0.92] tracking-[-0.03em] md:text-5xl">
                      {spread.title}
                    </h2>
                    <p className="mt-5 max-w-md body-text">
                      {spread.description}
                    </p>

                    <div className="mt-6 h-0.5 w-12 bg-accent" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <section className="border-t border-border section-px py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-4xl font-bold uppercase leading-[0.92] tracking-[-0.04em] md:text-6xl">
            Ahora es
            <br />
            tu turno.
          </p>
          <p className="mt-6 body-text">
            Cada look que viste es una invitación. No a copiar, sino a crear tu
            propia versión. El catálogo está abierto.
          </p>
          <Button asChild variant="hero" size="hero" className="mt-10">
            <Link href={ROUTES.catalogoAnchor}>
              Explorar catálogo <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
