import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SobreNosotrosPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── Header ── */}
      <header className="border-b border-border px-5 py-6 md:px-10 lg:px-16">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="asphalt px-5 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
            Sobre Nosotros
          </p>
          <h1 className="mt-4 text-5xl font-black uppercase tracking-[-0.04em] md:text-7xl lg:text-8xl">
            ESTO ES EASY
          </h1>
        </div>
      </section>

      {/* ── Contenido ── */}
      <section className="px-5 py-20 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-5 border-t border-border pt-8">
              <p className="text-base leading-relaxed text-muted-foreground">
                EASY es calle. Es creatividad pura y la necesidad de expresarse
                sin pedir permiso. Más que una marca, somos el movimiento de los
                que buscan destacar con autenticidad.
              </p>
            </div>
            <div className="space-y-5 border-t border-border pt-8">
              <h2 className="font-brush text-2xl text-violet">
                El estilo no se impone, se elige.
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                En nuestras colecciones encontrarás tu voz, yendo desde la
                rebeldía de lo urbano hasta la nitidez de lo elegante. Cada
                prenda y combinación es una extensión de quién eres.
              </p>
            </div>
            <div className="space-y-5 border-t border-border pt-8">
              <h2 className="font-brush text-2xl text-violet">
                Tu flow, tus reglas.
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Nuestra misión es darte el poder para sacar lo mejor de ti.
                Porque la moda cambia y las tendencias pasan, pero la
                personalidad se queda.
              </p>
            </div>
          </div>

          {/* ── Cierre ── */}
          <div className="mt-20 border-l-2 border-accent pl-6 md:pl-8">
            <p className="text-lg font-semibold uppercase tracking-wide text-foreground/80 md:text-xl">
              No vestimos a todos por igual. Nosotros ponemos las herramientas;
              tú defines el estilo.
            </p>
          </div>

          {/* ── CTA ── */}
          <div className="mt-16">
            <Link
              href="/"
              className="inline-block bg-accent px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-accent-foreground transition-colors hover:bg-accent/80"
            >
              Explorar Colecciones
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
