import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeHero } from "./_components/home-hero";
import { HomeProducts } from "./_components/home-products";
import { HomeNewsletter } from "./_components/home-newsletter";
import { HomeFooter } from "./_components/home-footer";

export const metadata: Metadata = {
  title: "DYDALO — Streetwear Premium",
};

export default function HomePage() {
  return (
    <main className="page-root">
      <HomeHero />

      <div className="overflow-hidden border-y border-border bg-accent py-3 text-accent-foreground">
        <div className="ticker-track flex w-max whitespace-nowrap text-xs font-bold tracking-[0.24em]">
          {[0, 1, 2, 3].map((copy) => (
            <span key={copy} aria-hidden={copy !== 0} className="pr-12">
              EL ESTILO NO SE IMPONE — SE ELIGE — FLOW SIN LÍMITES — DYDALO
              WORLDWIDE — THE REAL CREAM — UNDERGROUND STREETWEAR — SUMA A TU
              ESTILO — MAKE IT LOOK DYDALO —{" "}
            </span>
          ))}
        </div>
      </div>

      <section
        id="manifesto"
        className="asphalt grid min-h-[55vh] items-center gap-10 border-b border-border section-px py-24 md:grid-cols-12"
      >
        <p className="text-4xl font-bold uppercase leading-[0.85] tracking-[-0.06em] text-foreground sm:text-5xl md:col-span-4 md:text-7xl md:text-8xl">
          make it
          <br />
          look dydalo.
        </p>
        <div className="md:col-span-7 md:col-start-6">
          <p className="mb-4 section-tag">NO ES SOLO ROPA</p>
          <h2 className="max-w-4xl text-4xl font-medium leading-[0.98] tracking-[-0.05em] md:text-6xl lg:text-7xl">
            HECHO PARA QUIEN NO PIDE PERMISO.
          </h2>
          <p className="mt-8 max-w-xl text-sm leading-7 text-muted-foreground">
            Cortes precisos, materiales que hablan y piezas de edición limitada.
            De la calle al foco, sin cambiar quién eres.
          </p>
        </div>
      </section>

      <Suspense>
        <HomeProducts />
      </Suspense>

      <footer className="border-t border-border">
        <HomeNewsletter />
        <HomeFooter />
      </footer>
    </main>
  );
}
