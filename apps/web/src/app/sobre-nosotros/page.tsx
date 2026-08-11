import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sobre Nosotros",
  description:
    "DYDALO es calle. Creatividad pura sin pedir permiso. Conoce nuestra historia y lo que nos mueve.",
};
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";

export default function SobreNosotrosPage() {
  return (
    <main className="page-root">
      <section className="page-hero relative overflow-hidden">
        <Image
          src="/images/dydalo-panoramica.png"
          alt="Batalla de rap al atardecer"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_65%]"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="container-page relative z-10">
          <PageBreadcrumbs
            className="mb-4 [&_a]:text-white/70 [&_span]:text-accent"
            items={[
              { label: "Inicio", href: ROUTES.home },
              { label: "Sobre nosotros" },
            ]}
          />
          <h1 className="page-hero-heading text-accent">
            ESTO ES DYDALO
          </h1>
        </div>
      </section>

      <section className="section-px py-16 md:py-24">
        <div className="container-page space-y-20 md:space-y-28">
          <div className="max-w-2xl">
            <div className="mb-6 h-0.5 w-12 bg-accent" />
            <h2 className="text-3xl font-bold uppercase leading-[0.95] tracking-[-0.02em] md:text-5xl">
              Hecho en la calle.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              DYDALO es calle. Es creatividad pura y la necesidad de expresarse
              sin pedir permiso. Más que una marca, somos el movimiento de los
              que buscan destacar con autenticidad.
            </p>
          </div>

          <div className="ml-auto max-w-2xl md:mr-0 md:ml-auto">
            <div className="mb-6 h-0.5 w-12 bg-accent md:ml-auto" />
            <h2 className="text-3xl font-bold uppercase leading-[0.95] tracking-[-0.02em] md:text-right md:text-5xl">
              El estilo no se impone,
              <br />
              se elige.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:ml-auto md:text-right md:text-lg">
              En nuestras colecciones encontrarás tu voz, yendo desde la
              rebeldía de lo urbano hasta la nitidez de lo elegante. Cada
              prenda y combinación es una extensión de quién eres.
            </p>
          </div>

          <div className="max-w-2xl">
            <div className="mb-6 h-0.5 w-12 bg-accent" />
            <h2 className="text-3xl font-bold uppercase leading-[0.95] tracking-[-0.02em] md:text-5xl">
              Tu flow, tus reglas.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Nuestra misión es darte el poder para sacar lo mejor de ti.
              Porque la moda cambia y las tendencias pasan, pero la
              personalidad se queda.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/20">
        <div className="container-page py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 inline-block border-l-2 border-accent py-2 pl-6 text-left">
              <p className="text-lg font-semibold uppercase leading-relaxed tracking-wide text-foreground md:text-2xl">
                No vestimos a todos por igual.
                <br />
                Nosotros ponemos las herramientas,
                <br />
                tú defines el estilo.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Button variant="hero" size="hero" asChild>
              <Link href={ROUTES.home}>Explorar Colecciones</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
