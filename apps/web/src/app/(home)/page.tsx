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

      <Suspense>
        <HomeProducts />
      </Suspense>
    </main>
  );
}
