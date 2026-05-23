import type { Category } from "@/lib/categories/types";

import { CategoryRow } from "./category-row";

type Group = { parent: Category; children: Category[] };

export function CategoryList({ grouped }: { grouped: Group[] }) {
  if (grouped.length === 0) {
    return (
      <p className="text-body text-muted-foreground" data-testid="categories-empty">
        No categories yet. Create one above.
      </p>
    );
  }

  return (
    <div data-testid="categories-list">
      {grouped.map(({ parent, children }) => (
        <div key={parent.id} className="border-b border-border last:border-b-0 py-2">
          <CategoryRow category={parent} />
          {children.map((child) => (
            <CategoryRow key={child.id} category={child} indented />
          ))}
        </div>
      ))}
    </div>
  );
}
