import { test, expect } from "@playwright/test";

const EMAIL = process.env.SEED_USER_EMAIL ?? "";
const PASSWORD = process.env.SEED_USER_PASSWORD ?? "";

const UNDO_WINDOW_MS = 5000;

test.describe("Phase 2 acceptance path", () => {
  test.beforeAll(() => {
    if (!EMAIL || !PASSWORD) {
      throw new Error(
        "SEED_USER_EMAIL and SEED_USER_PASSWORD must be set for the E2E test.",
      );
    }
  });

  test("add, edit, see on dashboard, search, delete with undo window", async ({
    page,
  }) => {
    // 1. Log in as the seed user (categories already seeded).
    await page.goto("/login");
    await page.getByTestId("email-input").fill(EMAIL);
    await page.getByTestId("password-input").fill(PASSWORD);
    await page.getByTestId("submit").click();

    // 2. After login, "/" 307s to /dashboard; top bar shows wordmark and a
    //    Transactions link.
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId("wordmark")).toBeVisible();
    await expect(page.getByTestId("nav-link-transactions")).toBeVisible();

    // 3. Click the Transactions link → /transactions. Empty state visible.
    await page.getByTestId("nav-link-transactions").click();
    await expect(page).toHaveURL(/\/transactions$/);
    await expect(page.getByTestId("transactions-empty-state")).toBeVisible();

    // 4. Click "Add transaction". Sheet opens, URL has ?new=true.
    await page.getByTestId("add-transaction-button").click();
    await expect(page).toHaveURL(/\/transactions\?new=true$/);
    await expect(page.getByTestId("transaction-sheet")).toBeVisible();
    await expect(page.getByTestId("transaction-form")).toBeVisible();

    // 5. Fill the form.
    await page.getByTestId("tx-payee-input").fill("Maxima");
    // Direction defaults to Spent; assert and leave as-is.
    await expect(page.getByTestId("tx-direction-spent")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.getByTestId("tx-amount-input").fill("34,27");
    // Date defaults to today; leave as-is.

    // Category: Food > Groceries (seeded).
    await page.getByTestId("category-combobox-trigger").click();
    await page
      .locator('[data-testid^="category-combobox-item-"]')
      .filter({ hasText: "Food > Groceries" })
      .first()
      .click();

    // Tag: inline-create "grocery".
    await page.getByTestId("tag-combobox-trigger").click();
    await page.getByTestId("tag-combobox-input").fill("grocery");
    await page.getByTestId("tag-combobox-create").click();
    // Close the popover by clicking the trigger again.
    await page.keyboard.press("Escape");

    await page.getByTestId("tx-description-input").fill("weekly run");
    await page.getByTestId("tx-notes-input").fill("wine for friends");

    // 6. Save. Sheet closes, row appears, URL returns to /transactions.
    await page.getByTestId("tx-save").click();
    await expect(page).toHaveURL(/\/transactions$/);
    await expect(page.getByTestId("transaction-sheet")).not.toBeVisible();

    const row = page.locator('[data-testid^="transaction-row-"]').first();
    await expect(row).toBeVisible();
    await expect(row).toContainText("Maxima");
    await expect(row).toContainText("weekly run");

    // 7. Click the row. Sheet opens at ?edit=tx_id with values pre-filled.
    await row.click();
    await expect(page).toHaveURL(/\/transactions\?edit=[^&]+$/);
    await expect(page.getByTestId("transaction-sheet")).toBeVisible();
    await expect(page.getByTestId("tx-payee-input")).toHaveValue("Maxima");
    await expect(page.getByTestId("tx-amount-input")).toHaveValue("34,27");
    await expect(page.getByTestId("tx-description-input")).toHaveValue(
      "weekly run",
    );

    // 8. Edit description, save, list reflects change.
    await page.getByTestId("tx-description-input").fill("weekly run, extras");
    await page.getByTestId("tx-save").click();
    await expect(page).toHaveURL(/\/transactions$/);
    await expect(row).toContainText("weekly run, extras");

    // 9. (Reordered from plan.) Navigate to /dashboard; card shows "This
    //    month" with count 1 + "View all" link back to /transactions.
    await page.getByTestId("nav-link-dashboard").click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByTestId("dashboard-this-month-card"),
    ).toBeVisible();
    await expect(page.getByTestId("dashboard-this-month-count")).toHaveText(
      "1",
    );
    await page.getByTestId("dashboard-view-all-link").click();
    await expect(page).toHaveURL(/\/transactions$/);

    // 10. Type "Maxima" in search → list filters to one row, URL has q=Maxima.
    await page.getByTestId("transaction-search").fill("Maxima");
    await expect(page).toHaveURL(/\/transactions\?q=Maxima$/);
    await expect(
      page.locator('[data-testid^="transaction-row-"]'),
    ).toHaveCount(1);

    // 11. Clear search. Click Delete on the row. Row vanishes from list,
    //     Sonner toast appears with "Undo".
    await page.getByTestId("transaction-search").fill("");
    await expect(page).toHaveURL(/\/transactions$/);
    const deleteButton = page
      .locator('[data-testid^="transaction-delete-"]')
      .first();
    // Force the click because the delete button only becomes opaque on row
    // hover; Playwright's actionability check otherwise waits for visibility.
    await deleteButton.click({ force: true });
    await expect(page.getByText("Transaction deleted.")).toBeVisible();
    await expect(
      page.locator('[data-testid^="transaction-row-"]'),
    ).toHaveCount(0);

    // 12. Wait for the undo window to elapse; the toast disappears and the
    //     transaction is finalised gone.
    await page.waitForTimeout(UNDO_WINDOW_MS + 500);
    await expect(page.getByText("Transaction deleted.")).not.toBeVisible();
    await page.reload();
    await expect(page.getByTestId("transactions-empty-state")).toBeVisible();

    // 13. Log out, return to /login.
    await page.getByTestId("user-menu-trigger").click();
    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
