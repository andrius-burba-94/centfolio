"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory } from "@/lib/categories/actions";
import type { Category } from "@/lib/categories/types";

type Props = {
  topLevelOptions: Category[];
};

export function NewCategoryForm({ topLevelOptions }: Props) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const result = await createCategory({
        name,
        parentId: parentId || null,
      });
      if (result.ok) {
        setName("");
        setParentId("");
        toast.success(`Category "${name.trim()}" created.`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-10 flex flex-col gap-3 rounded-md bg-card p-6"
      data-testid="new-category-form"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-category-name">New category</Label>
        <Input
          id="new-category-name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="Groceries, Salary, Subscriptions"
          required
          data-testid="new-category-name"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-category-parent">Parent (optional)</Label>
        <select
          id="new-category-parent"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="rounded-sm border border-input bg-background px-[14px] py-[10px] text-body text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
          data-testid="new-category-parent"
        >
          <option value="">(Top level, no parent)</option>
          {topLevelOptions.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.name}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="submit"
        disabled={pending || !name.trim()}
        className="self-start"
        data-testid="new-category-submit"
      >
        {pending ? "Creating" : "Create"}
      </Button>
    </form>
  );
}
