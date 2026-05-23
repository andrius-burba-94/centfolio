import { listCategories, groupByParent } from "@/lib/categories/queries";

import { CategoryList } from "./category-list";
import { NewCategoryForm } from "./new-category-form";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategories();
  const grouped = groupByParent(categories);
  const topLevelOptions = categories.filter((c) => !c.parentId);

  return (
    <section className="flex flex-1 flex-col px-6 py-8 max-w-[800px] w-full mx-auto">
      <header className="mb-8">
        <h1
          className="font-display text-headline text-foreground"
          data-testid="categories-page-title"
        >
          Categories
        </h1>
        <p className="mt-2 text-body text-muted-foreground">
          {categories.length} categor{categories.length === 1 ? "y" : "ies"}.
          Two levels deep; rename or delete from here.
        </p>
      </header>

      <NewCategoryForm topLevelOptions={topLevelOptions} />

      <CategoryList grouped={grouped} />
    </section>
  );
}
