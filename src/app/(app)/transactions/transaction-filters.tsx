"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { CategoryCombobox } from "@/components/feature/category-combobox";
import { TagCombobox } from "@/components/feature/tag-combobox";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/categories/types";
import type { Tag } from "@/lib/tags/types";
import type { DateRangeName } from "@/lib/transactions/date-range";
import { cn } from "@/lib/utils";

type Props = {
  initial: {
    q: string;
    range: DateRangeName;
    from?: string;
    to?: string;
    categoryId: string | null;
    tagIds: string[];
  };
  categories: Category[];
  tags: Tag[];
};

const SEARCH_DEBOUNCE_MS = 300;

const rangeChips: { name: DateRangeName; label: string }[] = [
  { name: "this-month", label: "This month" },
  { name: "last-month", label: "Last month" },
  { name: "this-year", label: "This year" },
  { name: "all", label: "All time" },
];

export function TransactionFilters({ initial, categories, tags }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(initial.q);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtersActive =
    initial.q !== "" ||
    initial.range !== "this-month" ||
    initial.categoryId !== null ||
    initial.tagIds.length > 0;

  function pushParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams();
    const current = {
      q: initial.q || "",
      range: initial.range === "this-month" ? "" : initial.range,
      from: initial.range === "custom" ? (initial.from ?? "") : "",
      to: initial.range === "custom" ? (initial.to ?? "") : "",
      category: initial.categoryId ?? "",
      tags: initial.tagIds.join(","),
      ...patch,
    };

    for (const [key, value] of Object.entries(current)) {
      if (value && value !== "") {
        params.set(key, value);
      }
    }

    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/transactions?${qs}` : "/transactions");
    });
  }

  function onSearchChange(value: string) {
    setQ(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      pushParams({ q: value || null });
    }, SEARCH_DEBOUNCE_MS);
  }

  function setRange(name: DateRangeName) {
    pushParams({ range: name === "this-month" ? null : name });
  }

  function setCategory(id: string | null) {
    pushParams({ category: id ?? null });
  }

  function setTags(ids: string[]) {
    pushParams({ tags: ids.length ? ids.join(",") : null });
  }

  function clearAll() {
    setQ("");
    startTransition(() => {
      router.replace("/transactions");
    });
  }

  useEffect(() => {
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, []);

  return (
    <div
      className="flex flex-wrap items-center gap-3"
      data-testid="transaction-filters"
    >
      <div className="relative flex-1 min-w-[240px]">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search merchant, description, notes"
          className="pl-9"
          data-testid="transaction-search"
        />
      </div>

      <div
        className="flex items-center gap-1 rounded-sm border border-input bg-background p-0.5"
        role="group"
        aria-label="Date range"
      >
        {rangeChips.map((chip) => (
          <button
            key={chip.name}
            type="button"
            onClick={() => setRange(chip.name)}
            data-testid={`range-chip-${chip.name}`}
            aria-pressed={initial.range === chip.name}
            className={cn(
              "rounded-sm px-3 py-1.5 text-label transition-colors",
              initial.range === chip.name
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="min-w-[180px] flex-1 sm:max-w-[220px]">
        <CategoryCombobox
          value={initial.categoryId}
          onChange={setCategory}
          categories={categories}
          placeholder="All categories"
        />
      </div>

      <div className="min-w-[180px] flex-1 sm:max-w-[220px]">
        <TagCombobox
          value={initial.tagIds}
          onChange={setTags}
          tags={tags}
          placeholder="All tags"
        />
      </div>

      {filtersActive ? (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 text-label text-muted-foreground hover:text-foreground"
          data-testid="clear-filters"
        >
          <X className="size-4" aria-hidden="true" />
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
