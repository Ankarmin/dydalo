import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-background px-5 pb-12 pt-24 sm:px-10 sm:pb-16 md:px-16 md:pb-20 md:pt-28 lg:px-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/images/dydalo-new-hero.png"
          alt="Dos modelos DYDALO al atardecer en la ciudad"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center] max-md:object-[80%_center]"
        />
        <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-[calc(100svh-6rem)] w-full max-w-7xl items-start">
        <div className="w-full max-w-xl pt-6 sm:pt-10 md:pt-[clamp(4rem,14vh,12rem)]">
          <h1 className="font-display max-w-[11ch] text-[clamp(2.8rem,6vw,6rem)] font-bold uppercase leading-[0.84] tracking-[-0.04em] text-white">
            <span className="block">Streetwear</span>
            <span className="block text-transparent [-webkit-text-stroke:1px_white] sm:[-webkit-text-stroke:2px_white]">
              Sin reglas
            </span>
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
