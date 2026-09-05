import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <section className="relative isolate min-h-[82svh] overflow-hidden bg-background px-5 pb-12 pt-24 sm:px-10 sm:pb-16 md:px-16 md:pb-20 md:pt-28 lg:px-24">
      <div className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
        <Image
          src="/images/dydalo-new-hero.png"
          alt="Dos modelos DYDALO al atardecer en la ciudad"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_30%]"
        />
        <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
      </div>

      <div className="relative z-10 w-full lg:hidden">
        <div className="relative left-1/2 -mt-8 aspect-square w-screen max-w-none -translate-x-1/2 overflow-hidden sm:aspect-[4/3] md:-mt-12 md:aspect-[5/4]">
          <Image
            src="/images/dydalo-new-hero.png"
            alt="Dos modelos DYDALO al atardecer en la ciudad"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[80%_25%] sm:object-[50%_22%] md:object-[85%_25%]"
          />
        </div>
        <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-8 text-center sm:px-10">
          <h1 className="font-display text-[clamp(3rem,12vw,4.5rem)] font-bold uppercase leading-[0.88] tracking-tight text-foreground">
            <span className="block">Tu flow</span>
            <span className="block text-accent">Tus reglas</span>
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-sm font-bold uppercase leading-[1.8] tracking-[0.16em] text-muted-foreground">
            Prendas que hablan por ti. Diseños únicos, actitud real. Dydalo es tu estilo.
          </p>
          <Button asChild variant="hero" size="hero" className="mx-auto mt-7 w-full max-w-sm text-sm">
            <Link href="/catalogo">
              EXPLORAR CATÁLOGO <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative z-10 hidden min-h-[calc(82svh-6rem)] w-full max-w-7xl items-start lg:flex">
        <div className="w-full max-w-xl pt-6 sm:pt-8 lg:pt-[clamp(2rem,8vh,6rem)]">
          <h1 className="font-display max-w-[11ch] text-[clamp(2.8rem,6vw,6rem)] font-bold uppercase leading-[0.84] tracking-[-0.04em] text-white">
            <span className="block">Tu flow</span>
            <span className="block text-accent">Tus reglas</span>
          </h1>

          <div className="mt-7 h-1 w-16 bg-accent sm:mt-9 sm:w-20" />
          <p className="mt-6 max-w-xs text-xs font-bold uppercase leading-[1.9] tracking-[0.18em] text-white/90 sm:text-sm">
            Prendas que hablan por ti.
            <br />
            Diseños únicos, actitud real.
            <br />
            DYDALO es tu estilo.
          </p>

          <Button asChild variant="heroLight" size="hero" className="mt-8 w-full max-w-sm sm:mt-10">
            <Link href="/catalogo">
              EXPLORAR CATÁLOGO <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
