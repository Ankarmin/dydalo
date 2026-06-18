'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowLeft,
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
import { ThemeToggle } from '@/components/theme-toggle';
import { products } from '@/data/products';

export default function HomePage() {
  const [filter, setFilter] = useState('Todo');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
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

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) ?? null;

  const handleSelectProduct = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    setSelectedProductId(productId);
    setSelectedSize(product?.sizes?.[0] ?? null);
    setSelectedColor(product?.colors?.[0]?.name ?? null);
  };

  const handleAddFromDetail = () => {
    if (!selectedProduct) return;
    updateQuantity(selectedProduct.id, 1);
    showCartToast(
      `${selectedProduct.name} — ${selectedColor} / ${selectedSize}`,
      selectedProduct.price,
    );
    setSelectedProductId(null);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur-xl md:px-10">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-2xl font-bold tracking-[-0.08em] focus-ring"
          aria-label="DYDALO inicio"
        >
          DYDALO
        </button>
        <nav
          className="hidden items-center gap-4 text-[11px] font-bold tracking-[0.18em] md:flex"
          aria-label="Navegación principal"
        >
          <span className="text-muted-foreground" aria-hidden="true">
            SUMA A TU ESTILO
          </span>
          <span className="text-accent">/</span>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById('catalogo')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
            className="border-b border-accent pb-1 transition-colors hover:text-accent focus-ring"
          >
            COMPRAR
          </button>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
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
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-accent">
                  Tu selección
                </p>
                <SheetTitle className="text-3xl font-bold tracking-[-0.05em]">
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
                          src={
                            brokenImages.has(product.id)
                              ? '/images/dydalo-hero.jpg'
                              : product.image
                          }
                          alt={product.name}
                          width={112}
                          height={112}
                          sizes="112px"
                          onError={() =>
                            setBrokenImages((prev) =>
                              new Set(prev).add(product.id),
                            )
                          }
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
                                className="size-10 rounded-none"
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
                                className="size-10 rounded-none"
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
                    <p className="mt-1 text-3xl font-bold tracking-tight">
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

          {/* ── Producto detalle ── */}
          <Sheet
            open={selectedProductId !== null}
            onOpenChange={(open) => {
              if (!open) setSelectedProductId(null);
            }}
          >
            <SheetContent
              side="right"
              className="flex w-full flex-col border-border bg-background p-0 sm:max-w-md"
            >
              {selectedProduct && (
                <>
                  <SheetHeader className="sr-only">
                    <SheetTitle>{selectedProduct.name}</SheetTitle>
                    <SheetDescription>
                      Selecciona talla y color para {selectedProduct.name}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={
                        brokenImages.has(selectedProduct.id)
                          ? '/images/dydalo-hero.jpg'
                          : selectedProduct.image
                      }
                      alt={selectedProduct.name}
                      width={1024}
                      height={768}
                      sizes="(max-width: 640px) 100vw, 448px"
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedProductId(null)}
                      className="absolute left-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm transition-colors hover:bg-background/90 focus-ring"
                      aria-label="Cerrar detalle del producto"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
                  </div>

                  <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6">
                    <div className="border-b border-border pb-6 pt-6">
                      <p className="micro-label">
                        {selectedProduct.label}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold uppercase tracking-tight">
                        {selectedProduct.name}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {selectedProduct.type}
                      </p>
                      <p className="mt-3 text-xl font-bold">
                        ${selectedProduct.price}
                      </p>
                    </div>

                    {selectedProduct.sizes &&
                      selectedProduct.sizes.length > 1 && (
                        <div className="border-b border-border py-6">
                          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Talla
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.sizes.map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setSelectedSize(size)}
                                className={`flex h-10 min-w-[3rem] items-center justify-center border px-3 text-xs font-bold uppercase transition-colors ${
                                  selectedSize === size
                                    ? 'border-accent bg-accent text-accent-foreground'
                                    : 'border-border hover:border-muted-foreground'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="border-b border-border py-6">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Color
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {selectedProduct.colors.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setSelectedColor(color.name)}
                            className="flex items-center gap-2"
                          >
                            <span
                              className={`size-7 rounded-full border-2 transition-colors ${
                                selectedColor === color.name
                                  ? 'border-accent'
                                  : 'border-border'
                              }`}
                              style={{ backgroundColor: color.hex }}
                            />
                            <span
                              className={`text-xs uppercase ${
                                selectedColor === color.name
                                  ? 'text-foreground font-bold'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {color.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8">
                      <Button
                        variant="hero"
                        size="hero"
                        className="w-full"
                        onClick={handleAddFromDetail}
                      >
                        AÑADIR A LA BOLSA <ArrowUpRight />
                      </Button>
                    </div>
                  </div>
                </>
              )}
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
            <button
              type="button"
              className="border-b border-accent py-4 text-accent focus-ring"
              onClick={() => {
                setMenuOpen(false);
                document
                  .getElementById('catalogo')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              COMPRAR
            </button>
          </nav>
        )}
      </header>

      <section className="relative isolate flex min-h-[92svh] items-center justify-center overflow-hidden px-5 pt-16 text-center">
        <Image
          src="/images/dydalo-hero.jpg"
          alt="Collage urbano nocturno sobre una pared de asfalto"
          fill
          priority
          className="absolute inset-0 -z-20 size-full object-cover opacity-55"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/20 via-background/25 to-background" />
        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
          <p className="mb-4 text-[10px] font-bold tracking-[0.42em] text-foreground/75 md:text-xs">
            UNDERGROUND STREETWEAR
          </p>
          <h1 className="text-[clamp(5rem,20vw,15rem)] font-bold leading-[0.72] tracking-[-0.1em] sm:text-[clamp(8rem,22vw,15rem)] lg:text-[15rem]">
            DYDALO
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
            <button
              type="button"
              onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              VER CATÁLOGO <ArrowDownRight />
            </button>
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
        <p className="text-6xl font-bold uppercase leading-[0.85] tracking-[-0.06em] text-foreground md:col-span-4 md:text-8xl">
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

      <section id="catalogo" className="section-px py-20">
        <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-base font-bold uppercase tracking-[0.22em] text-accent">
              new drop
            </p>
            <h2 className="text-5xl font-bold tracking-[-0.06em] md:text-7xl">
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
          {visibleProducts.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <p className="text-sm text-muted-foreground">
                No se encontraron productos en esta categoría.
              </p>
            </div>
          ) : (
            visibleProducts.map((product, index) => (
              <article key={product.id} className="group relative">
                <button
                  type="button"
                  className="product-glass relative aspect-square w-full overflow-hidden border border-border text-left transition-all duration-500 cursor-pointer group-hover:-translate-y-2 group-hover:border-violet focus-ring"
                  onClick={() => handleSelectProduct(product.id)}
                  aria-label={`Ver detalles de ${product.name}`}
                >
                  <span className="absolute left-4 top-4 z-10 bg-background/80 px-3 py-2 text-[9px] font-bold tracking-[0.2em] backdrop-blur-md">
                    {product.label}
                  </span>
                  <span className="absolute right-3 top-2 z-10 text-lg font-bold tracking-tight text-foreground/20">
                    0{index + 1}
                  </span>
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
                    ${product.price}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <footer className="border-t border-border">
        {/* ── Links + Marca ── */}
        <section className="border-t border-border section-px py-14">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-12 lg:flex-row lg:gap-20">
            {/* Brand */}
            <div className="shrink-0">
              <p className="text-7xl font-bold tracking-[-0.09em] md:text-8xl">
                DYDALO
              </p>
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
                    'Nuevos Drops',
                    'Colecciones',
                    'Hombre',
                    'Mujer',
                    'Accesorios',
                  ].map((link) => (
                    <li key={link}>
                      <span className="text-sm text-muted-foreground">
                        {link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="heading-label">DYDALO</h4>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <Link
                      href="/sobre-nosotros"
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
                    { label: 'Contacto', href: '/contacto' },
                    { label: 'Envíos', href: '/envios' },
                    { label: 'Devoluciones', href: '/devoluciones' },
                    { label: 'Guía de Tallas', href: '/guia-de-tallas' },
                    { label: 'FAQ', href: '/faq' },
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
                const input = e.currentTarget.querySelector(
                  'input',
                ) as HTMLInputElement;
                if (input.value) {
                  alert(`¡Gracias! Te mantendremos al tanto en ${input.value}`);
                  input.value = '';
                }
              }}
              className="flex w-full max-w-sm"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="newsletter-email"
                type="email"
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
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row">
            <p>© 2026 DYDALO — Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <span className="text-muted-foreground">Términos</span>
              <span className="text-muted-foreground">Privacidad</span>
              <span className="text-muted-foreground">Cookies</span>
            </div>
          </div>
        </section>
      </footer>
    </main>
  );
}
