import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOGO_DARK, LOGO_LIGHT } from "@/config/constants";

export function HomeHero() {
  return (
    <section className="relative isolate flex min-h-[92svh] items-center justify-center overflow-hidden px-5 pt-16 text-center">
      <Image
        src="/images/dydalo-hero-negro.webp"
        alt="Collage urbano nocturno sobre una pared de asfalto"
        fill
        priority
        className="absolute inset-0 -z-20 size-full object-cover opacity-60 logo-dark"
      />
      <Image
        src="/images/dydalo-hero-blanco.webp"
        alt="Collage urbano diurno sobre una pared de asfalto"
        fill
        className="absolute inset-0 -z-20 size-full object-cover opacity-60 logo-light"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--hero-overlay-top)] via-[var(--hero-overlay-mid)] to-background" />
      <div className="relative z-10 flex w-full max-w-7xl flex-col items-center">
        <p className="mb-4 text-xs font-bold tracking-[0.25em] text-foreground/75 sm:tracking-[0.42em]">
          THE REAL CREAM — STREETWEAR & LIFESTYLE
        </p>
        <h1 className="w-full flex justify-center">
          <Image src={LOGO_DARK} alt="DYDALO" width={700} height={163} className="w-full max-w-[700px] logo-dark" />
          <Image src={LOGO_LIGHT} alt="DYDALO" width={700} height={163} className="w-full max-w-[700px] logo-light" />
        </h1>
        <p className="mt-8 text-sm font-semibold tracking-[0.48em] sm:text-lg">
          STREETWEAR & LIFESTYLE — THE REAL CREAM
        </p>
        <Button
          asChild
          variant="hero"
          size="hero"
          className="mt-10 w-full max-w-sm"
        >
          <Link href="/catalogo">
            EXPLORAR CATÁLOGO <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
