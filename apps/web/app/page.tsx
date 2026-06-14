'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowUpRight,
  Menu,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { showCartToast } from '@/components/cart-toast';

const products = [
  {
    id: 1,
    name: 'Midnight Track Set',
    type: 'Ropa',
    price: 189,
    image: '/images/easy-tracksuit.jpg',
    label: 'DROP 01',
  },
  {
    id: 2,
    name: 'Liquid Black Uniform',
    type: 'Ropa',
    price: 164,
    image: '/images/easy-satin-set.jpg',
    label: 'PREMIUM',
  },
  {
    id: 3,
    name: 'Pure Form Set',
    type: 'Ropa',
    price: 138,
    image: '/images/easy-white-basics.jpg',
    label: 'ESSENTIAL',
  },
  {
    id: 4,
    name: 'Two Tone Caps',
    type: 'Accesorios',
    price: 54,
    image: '/images/easy-caps.jpg',
    label: '2 PACK',
  },
  {
    id: 5,
    name: 'Cold Cuban Ice',
    type: 'Bling',
    price: 249,
    image: '/images/easy-bling.jpg',
    label: 'LIMITED',
  },
  {
    id: 6,
    name: 'Night Court High',
    type: 'Calzado',
    price: 176,
    image: '/images/easy-sneakers.jpg',
    label: 'HEAVY',
  },
];

export default function HomePage() {
  const [filter, setFilter] = useState('Todo');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleProducts = useMemo(
    () =>
      filter === 'Todo'
        ? products
        : products.filter((product) => product.type === filter),
    [filter],
  );
  const cartCount = Object.values(cart).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  const cartProducts = products.filter((product) => cart[product.id]);
  const subtotal = cartProducts.reduce(
    (total, product) => total + product.price * (cart[product.id] ?? 0),
    0,
  );

  const updateQuantity = (productId: number, change: number) => {
    setCart((current) => {
      const nextQuantity = (current[productId] ?? 0) + change;
      if (nextQuantity <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: nextQuantity };
    });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur-xl md:px-10">
        <a
          href="#top"
          className="text-2xl font-black tracking-[-0.08em]"
          aria-label="EASY inicio"
        >
          EASY
        </a>
        <nav
          className="hidden items-center gap-4 text-[11px] font-bold tracking-[0.18em] md:flex"
          aria-label="Navegación principal"
        >
          <span className="text-muted-foreground" aria-hidden="true">
            SUMA A TU ESTILO
          </span>
          <span className="text-accent">/</span>
          <a
            href="#catalogo"
            className="border-b border-accent pb-1 transition-colors hover:text-accent"
          >
            COMPRAR
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Abrir bolsa con ${cartCount} productos`}
                className="relative"
              >
                <ShoppingBag />
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center bg-accent text-[9px] font-bold text-accent-foreground">
                  {cartCount}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col border-border bg-background p-0 sm:max-w-md">
              <SheetHeader className="border-b border-border px-6 py-6 text-left">
                <p className="font-brush text-xl text-accent">Tu selección</p>
                <SheetTitle className="text-3xl font-black tracking-[-0.05em]">
                  TU BOLSA
                </SheetTitle>
                <SheetDescription>
                  {cartCount === 0
                    ? 'Todavía no elegiste tu flow.'
                    : `${cartCount} piezas seleccionadas`}
                </SheetDescription>
              </SheetHeader>

              {cartProducts.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                  <ShoppingBag
                    className="mb-5 size-10 text-muted-foreground"
                    strokeWidth={1.25}
                  />
                  <p className="text-xl font-bold">LA BOLSA ESTÁ VACÍA</p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    Encuentra una pieza que hable por ti y añádela a tu
                    selección.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-6">
                  {cartProducts.map((product) => {
                    const quantity = cart[product.id] ?? 0;
                    return (
                      <article
                        key={product.id}
                        className="flex gap-4 border-b border-border py-5"
                      >
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={112}
                          height={112}
                          className="size-24 object-cover"
                        />
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <p className="text-[9px] font-bold tracking-[0.18em] text-accent">
                              {product.label}
                            </p>
                            <h3 className="mt-1 truncate text-sm font-bold uppercase">
                              {product.name}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              ${product.price}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-border">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-none"
                                aria-label={`Quitar una unidad de ${product.name}`}
                                onClick={() => updateQuantity(product.id, -1)}
                              >
                                −
                              </Button>
                              <span className="w-7 text-center text-xs font-bold">
                                {quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-none"
                                aria-label={`Añadir una unidad de ${product.name}`}
                                onClick={() => updateQuantity(product.id, 1)}
                              >
                                +
                              </Button>
                            </div>
                            <p className="text-sm font-bold">
                              ${product.price * quantity}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-border bg-secondary/40 p-6">
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground">
                      SUBTOTAL
                    </p>
                    <p className="mt-1 text-3xl font-black tracking-tight">
                      ${subtotal}
                    </p>
                  </div>
                  <p className="text-right text-[10px] leading-4 text-muted-foreground">
                    ENVÍO CALCULADO
                    <br />
                    EN EL CHECKOUT
                  </p>
                </div>
                <Button
                  variant="hero"
                  size="hero"
                  className="w-full"
                  disabled={!cartCount}
                >
                  FINALIZAR COMPRA <ArrowUpRight />
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {menuOpen && (
          <nav className="absolute left-0 top-16 flex w-full flex-col border-b border-border bg-background p-6 text-sm font-bold tracking-[0.14em] md:hidden">
            <span className="pb-2 pt-4 text-xs text-muted-foreground">
              SUMA A TU ESTILO
            </span>
            <a
              href="#catalogo"
              className="border-b border-accent py-4 text-accent"
              onClick={() => setMenuOpen(false)}
            >
              COMPRAR
            </a>
          </nav>
        )}
      </header>

      <section
        id="top"
        className="relative isolate flex min-h-[92svh] items-center justify-center overflow-hidden px-5 pt-16 text-center"
      >
        <Image
          src="/images/easy-hero.jpg"
          alt="Collage urbano nocturno sobre una pared de asfalto"
          fill
          priority
          className="absolute inset-0 -z-20 size-full object-cover opacity-55"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/20 via-background/25 to-background" />
        <span className="absolute left-[7%] top-[27%] -rotate-12 font-brush text-3xl text-accent md:text-5xl">
          sin reglas
        </span>
        <span className="absolute bottom-[18%] right-[6%] rotate-6 font-brush text-2xl text-foreground/60 md:text-4xl">
          elige tu flow
        </span>
        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
          <p className="mb-4 text-[10px] font-bold tracking-[0.42em] text-foreground/75 md:text-xs">
            UNDERGROUND STREETWEAR
          </p>
          <h1 className="text-[28vw] font-black leading-[0.72] tracking-[-0.1em] sm:text-[22vw] lg:text-[15rem]">
            EASY
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
            <a href="#catalogo">
              VER CATÁLOGO <ArrowDownRight />
            </a>
          </Button>
        </div>
      </section>

      <div className="overflow-hidden border-y border-border bg-accent py-3 text-accent-foreground">
        <div className="ticker-track flex w-max whitespace-nowrap text-xs font-black tracking-[0.24em]">
          {[0, 1].map((copy) => (
            <span key={copy} aria-hidden={copy === 1} className="pr-12">
              EL ESTILO NO SE IMPONE — SE ELIGE — FLOW SIN LÍMITES — EASY
              WORLDWIDE —{' '}
            </span>
          ))}
        </div>
      </div>

      <section
        id="manifesto"
        className="asphalt grid min-h-[55vh] items-center gap-10 border-b border-border px-5 py-24 md:grid-cols-12 md:px-10 lg:px-16"
      >
        <p className="font-brush text-5xl leading-none text-violet md:col-span-4 md:text-7xl">
          make it
          <br />
          look easy.
        </p>
        <div className="md:col-span-7 md:col-start-6">
          <p className="mb-4 text-xs font-bold tracking-[0.22em] text-accent">
            NO ES SOLO ROPA
          </p>
          <h2 className="max-w-4xl text-4xl font-medium leading-[0.98] tracking-[-0.05em] md:text-6xl lg:text-7xl">
            HECHO PARA QUIEN NO PIDE PERMISO.
          </h2>
          <p className="mt-8 max-w-xl text-sm leading-7 text-muted-foreground">
            Cortes precisos, materiales que hablan y piezas de edición limitada.
            De la calle al foco, sin cambiar quién eres.
          </p>
        </div>
      </section>

      <section id="catalogo" className="px-5 py-20 md:px-10 lg:px-16">
        <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="mb-3 font-brush text-2xl text-accent">new drop</p>
            <h2 className="text-5xl font-black tracking-[-0.06em] md:text-7xl">
              EL CATÁLOGO
            </h2>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrar productos"
          >
            {['Todo', 'Ropa', 'Accesorios', 'Bling', 'Calzado'].map(
              (category) => (
                <Button
                  key={category}
                  variant={filter === category ? 'default' : 'street'}
                  size="sm"
                  onClick={() => setFilter(category)}
                  className="uppercase tracking-[0.12em]"
                >
                  {category}
                </Button>
              ),
            )}
          </div>
        </div>

        <div className="grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product, index) => (
            <article key={product.id} className="group relative">
              <div className="product-glass relative aspect-square overflow-hidden border border-border transition-all duration-500 group-hover:-translate-y-2 group-hover:border-violet">
                <span className="absolute left-4 top-4 z-10 bg-background/80 px-3 py-2 text-[9px] font-bold tracking-[0.2em] backdrop-blur-md">
                  {product.label}
                </span>
                <span className="absolute right-3 top-2 z-10 font-brush text-lg text-foreground/40">
                  0{index + 1}
                </span>
                <Image
                  src={product.image}
                  alt={product.name}
                  width={1024}
                  height={1024}
                  priority={index === 0}
                  className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 translate-y-full bg-primary p-3 transition-transform duration-300 group-hover:translate-y-0">
                  <Button
                    variant="ghost"
                    className="w-full rounded-none text-primary-foreground hover:bg-ink hover:text-foreground"
                    onClick={() => {
                      updateQuantity(product.id, 1);
                      showCartToast(product.name, product.price);
                    }}
                  >
                    AÑADIR A LA BOLSA <ArrowUpRight />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold uppercase tracking-tight">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {product.type}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  ${product.price}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        {/* ── Links + Marca ── */}
        <section className="border-t border-border px-5 py-14 md:px-10 lg:px-16">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-12 lg:flex-row lg:gap-20">
            {/* Brand */}
            <div className="shrink-0">
              <p className="text-7xl font-black tracking-[-0.09em] md:text-8xl">
                EASY
              </p>
              <p className="mt-6 max-w-xs font-brush text-2xl text-accent">
                el estilo no se impone,
                <br />
                se elige.
              </p>
            </div>

            {/* Links grid */}
            <div className="grid flex-1 grid-cols-2 gap-10 sm:grid-cols-3 lg:max-w-xl">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                  Tienda
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {["Nuevos Drops", "Colecciones", "Hombre", "Mujer", "Accesorios"].map(
                    (link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-sm text-muted-foreground transition-colors hover:text-accent"
                        >
                          {link}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                  EASY
                </h4>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <Link
                      href="/sobre-nosotros"
                      className="text-sm text-muted-foreground transition-colors hover:text-accent"
                    >
                      Sobre Nosotros
                    </Link>
                  </li>
                  {["Nuestra Historia", "Lookbook", "Colaboraciones", "Blog"].map(
                    (link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-sm text-muted-foreground transition-colors hover:text-accent"
                        >
                          {link}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                  Soporte
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {["Contacto", "Envíos", "Devoluciones", "Guía de Tallas", "FAQ"].map(
                    (link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-sm text-muted-foreground transition-colors hover:text-accent"
                        >
                          {link}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Newsletter ── */}
        <section className="border-t border-border px-5 py-10 md:px-10 lg:px-16">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                Únete al movimiento
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sé el primero en enterarte de nuevos drops y exclusivos.
              </p>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex w-full max-w-sm"
            >
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 border border-border bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                className="bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-foreground transition-colors hover:bg-accent/80"
              >
                Suscribir
              </button>
            </form>
          </div>
        </section>

        {/* ── Bottom bar ── */}
        <section className="border-t border-border px-5 py-6 md:px-10 lg:px-16">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row">
            <p>© 2026 EASY — Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="transition-colors hover:text-foreground">
                Términos
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                Privacidad
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                Cookies
              </a>
            </div>
          </div>
        </section>
      </footer>
    </main>
  );
}
