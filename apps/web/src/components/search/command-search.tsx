"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  searchProducts,
  groupResultsByCategory,
} from "@/lib/search/search-index";
import { formatPrice } from "@/lib/utils/format";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import { ROUTES } from "@/lib/utils/routes";

interface CommandSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandSearch({ open: externalOpen, onOpenChange: externalOnOpenChange }: CommandSearchProps = {}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = useMemo(
    () => (isControlled ? (externalOnOpenChange ?? (() => {})) : setInternalOpen),
    [isControlled, externalOnOpenChange],
  );

  const results = searchProducts(query);
  const grouped = groupResultsByCategory(results);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
      [setOpen],
  );

  const toggleRef = useCallback(
    () => {
      if (isControlled) {
        (externalOnOpenChange ?? (() => {}))(!open);
      } else {
        setInternalOpen((prev) => !prev);
      }
    },
    [isControlled, externalOnOpenChange, open],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.key) return;
      if (
        e.key.toLowerCase() === "k" &&
        (e.metaKey || e.ctrlKey) &&
        !e.repeat
      ) {
        e.preventDefault();
        toggleRef();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleRef]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Buscar productos (⌘K)"
        className="hidden xl:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Search />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Buscar productos</DialogTitle>
        <CommandInput
          placeholder="Buscar productos..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {!query && (
            <CommandEmpty className="flex flex-col items-center gap-3 py-8">
              <Search
                className="size-8 text-muted-foreground"
                strokeWidth={1.5}
              />
              <p className="text-sm text-muted-foreground">
                Escribe para buscar productos
              </p>
            </CommandEmpty>
          )}

          {query && results.length === 0 && (
            <CommandEmpty>
              No se encontraron productos para{" "}
              <span className="font-bold">&quot;{query}&quot;</span>
            </CommandEmpty>
          )}

          {[...grouped.entries()].map(([category, items]) => (
            <CommandGroup
              key={category}
              heading={`${category} (${items.length})`}
            >
              {items.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${category}`}
                  onSelect={() =>
                    runCommand(() =>
                      router.push(
                        ROUTES.catalogoCategory(product.category),
                      ),
                    )
                  }
                  className="flex items-center gap-3"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="size-10 shrink-0 rounded-sm object-cover"
                  />
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold uppercase">
                        {product.name}
                      </p>
                      <p className="truncate micro-text text-muted-foreground">
                        {categoriesStore.getBySlug(product.category)?.name ?? product.category}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs font-semibold text-muted-foreground">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
