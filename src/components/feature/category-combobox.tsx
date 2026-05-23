"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createCategory } from "@/lib/categories/actions";
import type { Category, CategoryWithDisplay } from "@/lib/categories/types";
import { withDisplayNames } from "@/lib/categories/transform";

type Props = {
  value: string | null;
  onChange: (id: string | null) => void;
  categories: Category[];
  placeholder?: string;
  disabled?: boolean;
};

export function CategoryCombobox({
  value,
  onChange,
  categories,
  placeholder = "Choose a category",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const withDisplay: CategoryWithDisplay[] = useMemo(
    () => withDisplayNames(categories),
    [categories],
  );

  const selected = withDisplay.find((c) => c.id === value) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return withDisplay;
    return withDisplay.filter((c) =>
      c.displayName.toLowerCase().includes(q),
    );
  }, [withDisplay, query]);

  const hasExactMatch = matches.some(
    (c) => c.name.toLowerCase() === query.trim().toLowerCase(),
  );
  const canCreate = query.trim().length > 0 && !hasExactMatch;

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  function handleCreate() {
    const name = query.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await createCategory({ name });
      if (result.ok && result.data) {
        onChange(result.data.id);
        setOpen(false);
        setQuery("");
        toast.success(`Created top-level category "${name}".`);
      } else if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between rounded-sm border border-input bg-background px-[14px] py-[10px] text-body outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring",
            "data-[state=open]:border-ring",
            "disabled:cursor-not-allowed disabled:bg-card disabled:text-placeholder",
            selected ? "text-foreground" : "text-placeholder",
          )}
          data-testid="category-combobox-trigger"
        >
          <span>{selected ? selected.displayName : placeholder}</span>
          <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput
            placeholder="Search or type to create"
            value={query}
            onValueChange={setQuery}
            data-testid="category-combobox-input"
          />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {matches.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.displayName}
                  onSelect={() => handleSelect(c.id)}
                  data-testid={`category-combobox-item-${c.id}`}
                >
                  {c.displayName}
                </CommandItem>
              ))}
            </CommandGroup>
            {canCreate && (
              <CommandGroup heading="Create new">
                <CommandItem
                  value={`create-${query}`}
                  onSelect={handleCreate}
                  disabled={pending}
                  data-testid="category-combobox-create"
                >
                  {pending
                    ? `Creating "${query.trim()}"…`
                    : `Create top-level "${query.trim()}"`}
                </CommandItem>
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem asChild>
                <Link
                  href="/transactions/categories"
                  className="text-muted-foreground"
                  data-testid="category-combobox-manage"
                >
                  Manage categories →
                </Link>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
