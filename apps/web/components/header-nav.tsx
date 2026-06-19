"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { LOGO_DARK, LOGO_LIGHT } from "@/lib/constants";
import { catalogCategories, products } from "@/data/products";

function getProductCount(slug: string): number {
  return products.filter((p) => p.category === slug).length;
}

export const marcaItems = [
  { label: "SOBRE NOSOTROS", href: ROUTES.sobreNosotros },
  { label: "NUESTRA HISTORIA", href: ROUTES.nuestraHistoria },
  { label: "COLABORACIONES", href: ROUTES.colaboraciones },
  { label: "BLOG", href: ROUTES.blog },
] as const;

export function HeaderNav({
  left,
  right,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const [catalogoOpen, setCatalogoOpen] = useState(false);
  const [marcaOpen, setMarcaOpen] = useState(false);
  const catalogoRef = useRef<HTMLDivElement>(null);
  const marcaRef = useRef<HTMLDivElement>(null);

  const handleCatalogoMouseEnter = useCallback(() => setCatalogoOpen(true), []);
  const handleCatalogoMouseLeave = useCallback(() => setCatalogoOpen(false), []);

  const handleMarcaMouseEnter = useCallback(() => setMarcaOpen(true), []);
  const handleMarcaMouseLeave = useCallback(() => setMarcaOpen(false), []);

  const handleKeyDown = useCallback(
    (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setter((prev) => !prev);
        }
        if (e.key === "Escape") {
          setter(false);
        }
      },
    [],
  );

  useEffect(() => {
    if (!catalogoOpen && !marcaOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        catalogoRef.current &&
        !catalogoRef.current.contains(e.target as Node)
      ) {
        setCatalogoOpen(false);
      }
      if (
        marcaRef.current &&
        !marcaRef.current.contains(e.target as Node)
      ) {
        setMarcaOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [catalogoOpen, marcaOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b-2 border-favorite bg-background/85 px-5 backdrop-blur-xl md:px-10">
      <div className="flex items-center gap-3">
        {left}
        <nav
          className="hidden items-center gap-3 text-xs font-bold tracking-[0.16em] lg:flex"
          aria-label="Navegación principal"
        >
          <Link
            href={ROUTES.loUltimo}
            className="transition-colors hover:text-accent focus-ring"
          >
            LO ÚLTIMO
          </Link>
          <span className="text-accent">/</span>
          <div
            ref={catalogoRef}
            className="relative py-3 -my-3"
            onMouseEnter={handleCatalogoMouseEnter}
            onMouseLeave={handleCatalogoMouseLeave}
          >
            <Link
              href={ROUTES.catalogo}
              role="button"
              aria-expanded={catalogoOpen}
              aria-haspopup="menu"
              tabIndex={0}
              onKeyDown={handleKeyDown(setCatalogoOpen)}
              className="flex items-center gap-1 transition-colors hover:text-accent focus-ring"
            >
              CATÁLOGO DYDALO <ChevronDown className="size-3" />
            </Link>
            {catalogoOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full z-50 min-w-[13rem] popover-panel p-1.5 shadow-lg"
              >
                {catalogCategories.map((cat) => {
                  const count = getProductCount(cat.slug);
                  return (
                    <Link
                      key={cat.slug}
                      href={ROUTES.catalogoCategory(cat.slug)}
                      role="menuitem"
                      onClick={() => setCatalogoOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-sm px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors hover:bg-accent hover:text-accent-foreground",
                        count === 0 && "pointer-events-none opacity-40",
                      )}
                    >
                      <span>{cat.name}</span>
                      <span className="ml-4 micro-text tracking-wider text-muted-foreground">
                        {count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          <span className="text-accent">/</span>
          <Link
            href={ROUTES.lookbook}
            className="transition-colors hover:text-accent focus-ring"
          >
            LOOKBOOK
          </Link>
          <span className="text-accent">/</span>
          <div
            ref={marcaRef}
            className="relative py-3 -my-3"
            onMouseEnter={handleMarcaMouseEnter}
            onMouseLeave={handleMarcaMouseLeave}
          >
            <Link
              href={ROUTES.sobreNosotros}
              role="button"
              aria-expanded={marcaOpen}
              aria-haspopup="menu"
              tabIndex={0}
              onKeyDown={handleKeyDown(setMarcaOpen)}
              className="flex items-center gap-1 transition-colors hover:text-accent focus-ring"
            >
              LA MARCA <ChevronDown className="size-3" />
            </Link>
            {marcaOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full z-50 min-w-[13rem] popover-panel p-1.5 shadow-lg"
              >
                {marcaItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setMarcaOpen(false)}
                    className="flex items-center rounded-sm px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      <Link
        href={ROUTES.home}
        className="absolute left-1/2 -translate-x-1/2 focus-ring"
        aria-label="DYDALO inicio"
      >
        <Image src={LOGO_DARK} alt="DYDALO" width={120} height={28} className="h-7 w-auto logo-dark" />
        <Image src={LOGO_LIGHT} alt="DYDALO" width={120} height={28} className="h-7 w-auto logo-light" />
      </Link>

      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
