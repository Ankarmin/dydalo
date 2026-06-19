'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import { products } from '@/data/products';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { ProductDetailSheet } from '@/components/product-detail-sheet';
import { FEATURED_PRODUCTS_COUNT, LOGO_DARK, LOGO_LIGHT } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ROUTES } from '@/lib/routes';

export default function HomePage() {
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
  const [newsletterEmail, setNewsletterEmail] = useState<string | null>(null);
  const newsletterRef = useRef<HTMLInputElement>(null);

  return (
    <main className="page-root">
      <section className="relative isolate flex min-h-[92svh] items-center justify-center overflow-hidden px-5 pt-16 text-center">
        <Image
          src="/images/dydalo-hero.jpg"
          alt="Collage urbano nocturno sobre una pared de asfalto"
          fill
          priority
          className="absolute inset-0 -z-20 size-full object-cover opacity-55"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/20 via-background/25 to-background" />
        <div className="relative z-10 flex w-full max-w-7xl flex-col items-center">
          <p className="mb-4 text-xs font-bold tracking-[0.25em] text-foreground/75 sm:tracking-[0.42em]">
            UNDERGROUND STREETWEAR
          </p>
          <h1 className="w-full flex justify-center">
            <Image src={LOGO_DARK} alt="DYDALO" width={700} height={163} className="w-full max-w-[700px] logo-dark" />
            <Image src={LOGO_LIGHT} alt="DYDALO" width={700} height={163} className="w-full max-w-[700px] logo-light" />
          </h1>
          <p className="mt-8 text-sm font-semibold tracking-[0.48em] sm:text-lg">
            THE REAL CREAM
          </p>
          <Button
            asChild
            variant="hero"
            size="hero"
            className="mt-10 w-full max-w-sm"
          >
            <Link href={ROUTES.catalogo}>
              VER CATÁLOGO <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>

      <div className="overflow-hidden border-y border-border bg-accent py-3 text-accent-foreground">
        <div className="ticker-track flex w-max whitespace-nowrap text-xs font-bold tracking-[0.24em]">
          {[0, 1, 2, 3].map((copy) => (
            <span key={copy} aria-hidden={copy !== 0} className="pr-12">
              EL ESTILO NO SE IMPONE — SE ELIGE — FLOW SIN LÍMITES — DYDALO
              WORLDWIDE — THE REAL CREAM — UNDERGROUND STREETWEAR — SUMA A TU
              ESTILO — MAKE IT LOOK DYDALO —{' '}
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
          <p className="mb-4 overline">NO ES SOLO ROPA</p>
          <h2 className="max-w-4xl text-4xl font-medium leading-[0.98] tracking-[-0.05em] md:text-6xl lg:text-7xl">
            HECHO PARA QUIEN NO PIDE PERMISO.
          </h2>
          <p className="mt-8 max-w-xl text-sm leading-7 text-muted-foreground">
            Cortes precisos, materiales que hablan y piezas de edición limitada.
            De la calle al foco, sin cambiar quién eres.
          </p>
        </div>
      </section>

      <section className="section-px section-lg">
        <div id="lo-ultimo" className="mb-12 scroll-mt-20">
          <p className="mb-3 text-base font-bold uppercase tracking-[0.22em] text-accent">
            new drop
          </p>
          <h2 className="text-5xl font-bold tracking-[-0.06em] md:text-7xl">
            LO ÚLTIMO
          </h2>
        </div>

        <div className="grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, FEATURED_PRODUCTS_COUNT).map((product, index) => (
              <article key={product.id} className="group relative">
                <ProductDetailSheet
                  productId={product.id}
                  trigger={
                    <button
                      type="button"
                      className="product-glass relative aspect-square w-full overflow-hidden border border-border text-left transition-all duration-500 cursor-pointer group-hover:-translate-y-2 group-hover:border-accent focus-ring"
                      aria-label={`Ver detalles de ${product.name}`}
                    >
                      <span className="absolute left-2 top-2 z-10 product-label sm:left-4 sm:top-4">
                        {product.label}
                      </span>
                      <span className="absolute right-3 top-2 z-10 text-lg font-bold tracking-tight text-foreground/20">
                        0{index + 1}
                      </span>
                      <FavoriteButton
                        productId={product.id}
                        productName={product.name}
                        variant="card"
                      />
                      <Image
                        src={
                          brokenImages.has(product.id)
                            ? '/images/dydalo-hero.jpg'
                            : product.image
                        }
                        alt={product.name}
                        width={1024}
                        height={1024}
                        priority={index === 0}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        onError={() =>
                          setBrokenImages((prev) => new Set(prev).add(product.id))
                        }
                        className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </button>
                  }
                />
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold uppercase tracking-tight">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.type}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </article>
            ))}
        </div>

        <div className="mt-16 flex justify-center">
          <Button asChild variant="hero" size="hero">
            <Link href={ROUTES.catalogo}>
              VER CATÁLOGO COMPLETO <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        {/* ── Links + Marca ── */}
        <section className="border-t border-border section-px py-14">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-12 lg:flex-row lg:gap-20">
            {/* Brand */}
            <div className="shrink-0">
              <Image src={LOGO_DARK} alt="DYDALO" width={275} height={64} className="h-14 w-auto md:h-16 logo-dark" />
              <Image src={LOGO_LIGHT} alt="DYDALO" width={275} height={64} className="h-14 w-auto md:h-16 logo-light" />
              <p className="mt-6 max-w-xs text-base font-bold tracking-[0.22em] text-accent">
                el estilo no se impone,
                <br />
                se elige.
              </p>
            </div>

            {/* Links grid */}
            <div className="grid flex-1 grid-cols-2 gap-10 sm:grid-cols-3 lg:max-w-xl">
              <div>
                <h4 className="heading-label">Tienda</h4>
                <ul className="mt-4 space-y-2.5">
                  {[
                    { label: 'Lo último', href: ROUTES.loUltimo },
                    { label: 'Polos', href: ROUTES.catalogoCategory('polos') },
                    { label: 'Hoodies', href: ROUTES.catalogoCategory('hoodies') },
                    { label: 'Jeans', href: ROUTES.catalogoCategory('jeans') },
                    { label: 'Accesorios', href: ROUTES.catalogoCategory('accesorios') },
                  ].map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="footer-link">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="heading-label">DYDALO</h4>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <Link
                      href={ROUTES.sobreNosotros}
                      className="footer-link"
                    >
                      Sobre Nosotros
                    </Link>
                  </li>
                  {[
                    'Nuestra Historia',
                    'Lookbook',
                    'Colaboraciones',
                    'Blog',
                  ].map((link) => (
                    <li key={link}>
                      <Link
                        href={`/${link.toLowerCase().replace(/\s+/g, '-')}`}
                        className="footer-link"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="heading-label">Soporte</h4>
                <ul className="mt-4 space-y-2.5">
                  {[
                    { label: 'Contacto', href: ROUTES.contacto },
                    { label: 'Envíos', href: ROUTES.envios },
                    { label: 'Devoluciones', href: ROUTES.devoluciones },
                    { label: 'Guía de Tallas', href: ROUTES.guiaDeTallas },
                    { label: 'FAQ', href: ROUTES.faq },
                  ].map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="footer-link"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Newsletter ── */}
        <section className="border-t border-border section-px py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <p className="heading-label">Únete al movimiento</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sé el primero en enterarte de nuevos drops y exclusivos.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const value = newsletterRef.current?.value;
                if (value) {
                  setNewsletterEmail(value);
                  if (newsletterRef.current) newsletterRef.current.value = '';
                }
              }}
              className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:gap-0"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="newsletter-email"
                ref={newsletterRef}
                type="email"
                required
                placeholder="tu@email.com"
                className="form-input flex-1"
              />
              <button
                type="submit"
                className="newsletter-btn"
              >
                Suscribir
              </button>
            </form>
          </div>
        </section>

        {/* ── Bottom bar ── */}
        <section className="border-t border-border section-px py-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 micro-text uppercase tracking-[0.2em] text-muted-foreground sm:flex-row">
            <p>© 2026 DYDALO — Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <span className="text-muted-foreground">Términos</span>
              <span className="text-muted-foreground">Privacidad</span>
              <span className="text-muted-foreground">Cookies</span>
            </div>
          </div>
        </section>
      </footer>

      <Dialog
        open={newsletterEmail !== null}
        onOpenChange={() => setNewsletterEmail(null)}
      >
        <DialogContent className="border-border bg-background sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight">
              GRACIAS
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Te mantendremos al tanto de nuevos drops y exclusivos en{" "}
              <span className="font-bold text-foreground">
                {newsletterEmail}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="hero"
            className="mt-2 w-full"
            onClick={() => setNewsletterEmail(null)}
          >
            ENTENDIDO
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
