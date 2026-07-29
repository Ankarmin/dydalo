"use client";

import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils/utils";

export type SortDirection = "asc" | "desc";

export interface SortState {
  field: string | null;
  direction: SortDirection;
}

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: SortState;
  onSortChange: (sort: SortState) => void;
  className?: string;
}

export function SortableHeader({
  label,
  field,
  currentSort,
  onSortChange,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort.field === field;
  const isAsc = isActive && currentSort.direction === "asc";

  function handleClick() {
    if (!isActive) {
      onSortChange({ field, direction: "asc" });
    } else if (currentSort.direction === "asc") {
      onSortChange({ field, direction: "desc" });
    } else {
      onSortChange({ field: null, direction: "asc" });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <th
      className={cn(
        "px-3 py-2 font-medium select-none",
        "cursor-pointer hover:text-foreground transition-colors",
        isActive && "text-foreground",
        className,
      )}
      role="columnheader"
      aria-sort={isActive ? (currentSort.direction === "asc" ? "ascending" : "descending") : "none"}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          isAsc ? (
            <ArrowUp className="size-3 text-accent" />
          ) : (
            <ArrowDown className="size-3 text-accent" />
          )
        ) : (
          <ChevronsUpDown className="size-3 text-muted-foreground/40" />
        )}
      </span>
    </th>
  );
}

export function defaultSort(): SortState {
  return { field: null, direction: "asc" };
}
