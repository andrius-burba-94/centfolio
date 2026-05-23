import type { Category } from "@/lib/categories/types";

/**
 * Row-friendly label for a category. Top-level categories show their name;
 * leaves show "Parent, Child" per the transactions table mockup. Distinct
 * from the combobox display ("Parent > Child") because the table has less
 * surrounding context to disambiguate hierarchy.
 */
export function categoryRowLabel(
  categoryId: string | null,
  categoriesById: Map<string, Category>,
): string {
  if (!categoryId) return "Uncategorized";
  const category = categoriesById.get(categoryId);
  if (!category) return "Uncategorized";
  if (!category.parentId) return category.name;
  const parent = categoriesById.get(category.parentId);
  return parent ? `${parent.name}, ${category.name}` : category.name;
}

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

export function formatTransactionDate(dateString: string): string {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return monthFormatter.format(d);
}
