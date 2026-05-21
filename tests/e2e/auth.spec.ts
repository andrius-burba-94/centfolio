import { test, expect } from "@playwright/test";

const EMAIL = process.env.SEED_USER_EMAIL ?? "";
const PASSWORD = process.env.SEED_USER_PASSWORD ?? "";

test.describe("Phase 1 acceptance path", () => {
  test.beforeAll(() => {
    if (!EMAIL || !PASSWORD) {
      throw new Error(
        "SEED_USER_EMAIL and SEED_USER_PASSWORD must be set for the E2E test.",
      );
    }
  });

  test("log in as seed user, switch theme, log out", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);

    await page.getByTestId("email-input").fill(EMAIL);
    await page.getByTestId("password-input").fill("not-the-right-password-1234");
    await page.getByTestId("submit").click();
    await expect(page.getByTestId("login-error")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByTestId("password-input").fill(PASSWORD);
    await page.getByTestId("submit").click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await expect(page.getByTestId("dashboard-empty-state")).toBeVisible();
    await expect(page.getByTestId("wordmark")).toBeVisible();

    await page.getByTestId("theme-toggle").click();
    await page.getByTestId("theme-dark").click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    await page.getByTestId("user-menu-trigger").click();
    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
