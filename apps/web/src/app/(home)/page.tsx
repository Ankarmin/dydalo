import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeHero } from "./_components/home-hero";
import { HomeProducts } from "./_components/home-products";
import { HomeNewsletter } from "./_components/home-newsletter";

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
        className="asphalt grid gap-10 overflow-hidden border-b border-border section-px py-16 sm:py-20 md:min-h-[55vh] md:grid-cols-12 md:items-center md:gap-8 md:py-24 lg:gap-10"
      >
        <p className="max-w-[9ch] text-[clamp(3.2rem,18vw,5rem)] font-bold uppercase leading-[0.85] tracking-[-0.06em] text-foreground sm:text-[5.5rem] md:col-span-5 md:text-[clamp(4.5rem,8vw,6.5rem)] lg:col-span-4 lg:text-8xl">
          make it
          <br />
          look dydalo.
        </p>
        <div className="max-w-2xl md:col-span-7 md:col-start-6 md:max-w-none">
          <p className="mb-3 text-[10px] tracking-[0.18em] section-tag sm:mb-4 sm:text-xs">
            NO ES SOLO ROPA
          </p>
          <h2 className="max-w-3xl text-[clamp(2.4rem,11vw,4rem)] font-medium leading-[0.96] tracking-[-0.05em] sm:text-6xl md:text-[clamp(3.25rem,6vw,5.5rem)] lg:text-7xl">
            HECHO PARA QUIEN NO PIDE PERMISO.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground sm:mt-6 sm:max-w-xl sm:leading-7 md:mt-8">
            Cortes precisos, materiales que hablan y piezas de edición limitada.
            De la calle al foco, sin cambiar quién eres.
          </p>
        </div>
      </section>

      <Suspense>
        <HomeProducts />
      </Suspense>

      <HomeNewsletter />
    </main>
  );
}
