import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Nosotros',
  description: 'DYDALO es calle. Creatividad pura sin pedir permiso. Conoce nuestra historia y lo que nos mueve.',
};
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';

export default function SobreNosotrosPage() {
  return (
    <main className="page-root">

      {/* ── Hero ── */}
      <section className="page-hero">
        <div className="container-page">
          <p className="section-tag">
            Sobre Nosotros
          </p>
          <h1 className="page-hero-heading lg:text-8xl">
            ESTO ES DYDALO
          </h1>
        </div>
      </section>

      {/* ── Contenido ── */}
      <section className="section-px pb-12 pt-12">
        <div className="container-page">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            <div className="">
              <div className="h-0.5 w-10 bg-accent" />
              <h2 className="mt-6 text-3xl font-bold leading-[0.92] tracking-[-0.02em] text-foreground">
                Hecho en la calle.
              </h2>
              <p className="mt-3 body-text">
                DYDALO es calle. Es creatividad pura y la necesidad de expresarse
                sin pedir permiso. Más que una marca, somos el movimiento de los
                que buscan destacar con autenticidad.
              </p>
            </div>
            <div className="">
              <div className="h-0.5 w-10 bg-accent" />
              <h2 className="mt-6 text-3xl font-bold leading-[0.92] tracking-[-0.02em] text-foreground">
                El estilo no se impone, se elige.
              </h2>
              <p className="mt-3 body-text">
                En nuestras colecciones encontrarás tu voz, yendo desde la
                rebeldía de lo urbano hasta la nitidez de lo elegante. Cada
                prenda y combinación es una extensión de quién eres.
              </p>
            </div>
            <div className="">
              <div className="h-0.5 w-10 bg-accent" />
              <h2 className="mt-6 text-3xl font-bold leading-[0.92] tracking-[-0.02em] text-foreground">
                Tu flow, tus reglas.
              </h2>
              <p className="mt-3 body-text">
                Nuestra misión es darte el poder para sacar lo mejor de ti.
                Porque la moda cambia y las tendencias pasan, pero la
                personalidad se queda.
              </p>
            </div>
          </div>

          {/* ── Cierre ── */}
          <div className="mt-12 border-l-2 border-accent pl-6 md:pl-8">
            <p className="text-lg font-semibold uppercase tracking-wide text-foreground/80 md:text-xl">
              No vestimos a todos por igual. Nosotros ponemos las herramientas,
              tú defines el estilo.
            </p>
          </div>

          {/* ── CTA ── */}
          <div className="mt-8">
            <Button variant="hero" size="hero" asChild>
              <Link href={ROUTES.home}>Explorar Colecciones</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
