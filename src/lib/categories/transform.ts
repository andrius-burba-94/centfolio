import type { Category, CategoryWithDisplay } from "./types";

export function withDisplayNames(categories: Category[]): CategoryWithDisplay[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return categories.map((c) => {
    if (!c.parentId) return { ...c, displayName: c.name };
    const parent = byId.get(c.parentId);
    return {
      ...c,
      displayName: parent ? `${parent.name} > ${c.name}` : c.name,
    };
  });
}

export function groupByParent(
  categories: Category[],
): Array<{ parent: Category; children: Category[] }> {
  const topLevel = categories.filter((c) => !c.parentId);
  return topLevel.map((parent) => ({
    parent,
    children: categories.filter((c) => c.parentId === parent.id),
  }));
}
