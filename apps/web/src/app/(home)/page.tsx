import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeHero } from "./_components/home-hero";
import { HomeProducts } from "./_components/home-products";

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

      <Suspense>
        <HomeProducts />
      </Suspense>
    </main>
  );
}
