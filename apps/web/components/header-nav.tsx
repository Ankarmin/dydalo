"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { catalogCategories, products } from "@/data/products";

function getProductCount(slug: string): number {
  return products.filter((p) => p.category === slug).length;
}

export function HeaderNav({
  left,
  right,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => setOpen(true), []);
  const handleMouseLeave = useCallback(() => setOpen(false), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur-xl md:px-10">
      <div className="flex items-center gap-3">
        {left}
        <nav
          className="hidden items-center gap-3 text-[11px] font-bold tracking-[0.16em] md:flex"
          aria-label="Navegacion principal"
        >
          <Link
            href="/#lo-ultimo"
            className="transition-colors hover:text-accent focus-ring"
          >
            LO ULTIMO
          </Link>
          <span className="text-accent">/</span>
          <div
            ref={dropdownRef}
            className="relative py-3 -my-3"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/catalogo"
              role="button"
              aria-expanded={open}
              aria-haspopup="menu"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              className="flex items-center gap-1 transition-colors hover:text-accent focus-ring"
            >
              CATALOGO DYDALO <ChevronDown className="size-3" />
            </Link>
            {open && (
              <div
                role="menu"
                className="absolute left-0 top-full z-50 min-w-[13rem] rounded-md border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur-xl"
              >
                {catalogCategories.map((cat) => {
                  const count = getProductCount(cat.slug);
                  return (
                    <Link
                      key={cat.slug}
                      href={`/catalogo/${cat.slug}`}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-sm px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors hover:bg-accent hover:text-accent-foreground",
                        count === 0 && "pointer-events-none opacity-40",
                      )}
                    >
                      <span>{cat.name}</span>
                      <span className="ml-4 text-[10px] tracking-wider text-muted-foreground">
                        {count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      <Link
        href="/"
        className="absolute left-1/2 -translate-x-1/2 text-2xl logo-oblique focus-ring"
        aria-label="DYDALO inicio"
      >
        DYDALO
      </Link>

      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
