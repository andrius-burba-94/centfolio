"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createTag } from "@/lib/tags/actions";
import type { Tag } from "@/lib/tags/types";

type Props = {
  value: string[];
  onChange: (ids: string[]) => void;
  tags: Tag[];
  placeholder?: string;
  disabled?: boolean;
};

export function TagCombobox({
  value,
  onChange,
  tags,
  placeholder = "Add tags",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);
  const selected = value
    .map((id) => byId.get(id))
    .filter((t): t is Tag => Boolean(t));

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, query]);

  const hasExactMatch = matches.some(
    (t) => t.name.toLowerCase() === query.trim().toLowerCase(),
  );
  const canCreate = query.trim().length > 0 && !hasExactMatch;

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  function handleCreate() {
    const name = query.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await createTag({ name });
      if (result.ok && result.data) {
        onChange([...value, result.data.id]);
        setQuery("");
        toast.success(`Created tag "${name}".`);
      } else if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
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
              selected.length > 0 ? "text-foreground" : "text-placeholder",
            )}
            data-testid="tag-combobox-trigger"
          >
            <span>
              {selected.length === 0
                ? placeholder
                : `${selected.length} tag${selected.length === 1 ? "" : "s"} selected`}
            </span>
            <ChevronDown
              className="size-4 shrink-0 opacity-60"
              aria-hidden="true"
            />
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
              data-testid="tag-combobox-input"
            />
            <CommandList>
              <CommandEmpty>No matches.</CommandEmpty>
              <CommandGroup>
                {matches.map((t) => {
                  const isSelected = value.includes(t.id);
                  return (
                    <CommandItem
                      key={t.id}
                      value={t.name}
                      onSelect={() => toggle(t.id)}
                      data-testid={`tag-combobox-item-${t.id}`}
                    >
                      <span className="flex-1">{t.name}</span>
                      {isSelected && (
                        <Check className="size-4" aria-hidden="true" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {canCreate && (
                <CommandGroup heading="Create new">
                  <CommandItem
                    value={`create-${query}`}
                    onSelect={handleCreate}
                    disabled={pending}
                    data-testid="tag-combobox-create"
                  >
                    {pending ? `Creating "${query.trim()}"…` : `Create "${query.trim()}"`}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="tag-combobox-chips">
          {selected.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => remove(tag.id)}
                aria-label={`Remove ${tag.name}`}
                className="rounded-full hover:text-foreground"
                data-testid={`tag-combobox-remove-${tag.id}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
