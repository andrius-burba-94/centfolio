"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteCategory, updateCategory } from "@/lib/categories/actions";
import type { Category } from "@/lib/categories/types";

type Props = {
  category: Category;
  indented?: boolean;
};

export function CategoryRow({ category, indented = false }: Props) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(category.name);
  const [pending, startTransition] = useTransition();

  function handleRename() {
    setDraftName(category.name);
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setDraftName(category.name);
  }

  function handleSave(event?: React.FormEvent) {
    event?.preventDefault();
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === category.name) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await updateCategory({ id: category.id, name: trimmed });
      if (result.ok) {
        setEditing(false);
        toast.success(`Renamed to "${trimmed}".`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategory({ id: category.id });
      if (result.ok) {
        toast.success(`Deleted "${category.name}".`);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className={`flex items-center gap-2 py-2 ${indented ? "pl-6" : ""}`}
        data-testid={`category-row-edit-${category.id}`}
      >
        <Input
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleCancel();
          }}
          maxLength={100}
          className="max-w-[280px]"
          data-testid={`category-row-input-${category.id}`}
        />
        <Button type="submit" disabled={pending} data-testid={`category-row-save-${category.id}`}>
          {pending ? "Saving" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={pending}
        >
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <div
      className={`flex items-center justify-between py-2 ${indented ? "pl-6" : ""}`}
      data-testid={`category-row-${category.id}`}
    >
      <span className={indented ? "text-body text-foreground" : "text-title text-foreground"}>
        {category.name}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRename}
          aria-label={`Rename ${category.name}`}
          data-testid={`category-row-rename-${category.id}`}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={pending}
          aria-label={`Delete ${category.name}`}
          data-testid={`category-row-delete-${category.id}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
