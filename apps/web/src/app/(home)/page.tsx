import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeHero } from "./_components/home-hero";
import { HomeCategories } from "./_components/home-categories";
import { HomeProducts } from "./_components/home-products";

export const metadata: Metadata = {
  title: "DYDALO — Streetwear Premium",
};

export default function HomePage() {
  return (
    <main className="page-root">
      <HomeHero />

      <Suspense>
        <HomeCategories />
      </Suspense>

      <Suspense>
        <HomeProducts />
      </Suspense>
    </main>
  );
}
