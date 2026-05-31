import { expect, test } from "@playwright/test";

import {
  clearGeminiFixture,
  setGeminiHappy,
  setGeminiMalformed,
} from "../helpers/gemini-mock";

const EMAIL = process.env.SEED_USER_EMAIL ?? "";
const PASSWORD = process.env.SEED_USER_PASSWORD ?? "";

const SAMPLE_EMAIL_BODY = `From: do-not-reply@iki.lt
Subject: Jūsų pirkimo kvitas

IKI, UAB
Vilnius

2026-05-31 18:42  Kvitas Nr. 1832

Pienas Rokiškio 2,5%, 1L     1,29
Duona Bočių ruginė           1,89
Bananai 0,342 kg @ 2,50/kg   0,86
Total: 4,04
`;

const PARSED_HAPPY = {
  merchant: "IKI",
  date: "2026-05-31",
  totalCents: 404,
  lineItems: [
    {
      name: "Pienas Rokiškio 2,5%, 1L",
      quantity: 1,
      unit: null,
      unitPriceCents: 129,
      lineTotalCents: 129,
    },
    {
      name: "Duona Bočių ruginė",
      quantity: 1,
      unit: null,
      unitPriceCents: 189,
      lineTotalCents: 189,
    },
    {
      name: "Bananai",
      quantity: 0.342,
      unit: "kg",
      unitPriceCents: 250,
      lineTotalCents: 86,
    },
  ],
};

test.describe("Phase 3 receipts, text mode", () => {
  test.beforeAll(() => {
    if (!EMAIL || !PASSWORD) {
      throw new Error(
        "SEED_USER_EMAIL and SEED_USER_PASSWORD must be set for the E2E test.",
      );
    }
  });

  test.afterEach(async () => {
    await clearGeminiFixture();
  });

  async function login(page: import("@playwright/test").Page) {
    await page.goto("/login");
    await page.getByTestId("email-input").fill(EMAIL);
    await page.getByTestId("password-input").fill(PASSWORD);
    await page.getByTestId("submit").click();
    await expect(page).toHaveURL(/\/dashboard$/);
  }

  test("happy path: paste, parse, edit, confirm, delete", async ({ page }) => {
    await setGeminiHappy(PARSED_HAPPY);
    await login(page);

    // Receipts inline link in the top nav.
    await expect(page.getByTestId("nav-link-receipts")).toBeVisible();
    await page.getByTestId("nav-link-receipts").click();
    await expect(page).toHaveURL(/\/receipts$/);

    // Empty state OR a populated list (depends on what's on the seed account
    // from previous runs). If populated, ensure no stale data interferes by
    // bailing if the merchant we're about to create is already there.
    const isEmpty = await page.getByTestId("receipts-empty-state").isVisible()
      .catch(() => false);
    if (isEmpty) {
      await expect(page.getByTestId("receipts-empty-state")).toBeVisible();
      await page.getByTestId("add-receipt-empty-button").click();
    } else {
      await page.getByTestId("add-receipt-button").click();
    }

    // Entry sheet opens at ?new=true.
    await expect(page).toHaveURL(/\/receipts\?new=true$/);
    await expect(page.getByTestId("receipt-entry-sheet")).toBeVisible();
    await page.getByTestId("receipt-text-input").fill(SAMPLE_EMAIL_BODY);
    await page.getByTestId("receipt-entry-save").click();

    // After save, navigate to /receipts/[id]. The shell renders while the
    // Suspense boundary resolves; the parsed-fields region streams in.
    await expect(page).toHaveURL(/\/receipts\/[a-z0-9]+$/);
    await expect(page.getByTestId("receipt-detail")).toBeVisible();
    await expect(page.getByTestId("receipt-source-text")).toContainText(
      "Pienas Rokiškio",
    );

    // Wait for the review form to mount (Suspense resolved).
    await expect(page.getByTestId("receipt-review-form")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId("receipt-merchant-input")).toHaveValue(
      "IKI",
    );
    await expect(page.getByTestId("receipt-total")).toContainText("4,04");

    // Edit the first line item's name.
    await page.getByTestId("receipt-line-item-name-0").fill(
      "Pienas (Rokiškio)",
    );

    // Confirm.
    await page.getByTestId("receipt-confirm-button").click();
    await expect(page.getByTestId("receipt-detail-status")).toContainText(
      "Confirmed",
      { timeout: 5000 },
    );

    // Back to the list, the receipt should be visible with the confirmed
    // status badge.
    await page.getByTestId("receipt-back-link").click();
    await expect(page).toHaveURL(/\/receipts$/);
    await expect(page.getByTestId("receipts-table")).toBeVisible();
    await expect(page.getByText("IKI").first()).toBeVisible();

    // Open the receipt again to verify the read-only view, then delete.
    await page.getByText("IKI").first().click();
    await expect(page).toHaveURL(/\/receipts\/[a-z0-9]+$/);
    await expect(page.getByTestId("receipt-review-form")).toBeVisible();
    await page.getByTestId("receipt-delete-button").click();
    await expect(page).toHaveURL(/\/receipts$/);
  });

  test("failed-state path: malformed parse, retry button visible", async ({ page }) => {
    await setGeminiMalformed();
    await login(page);

    await page.getByTestId("nav-link-receipts").click();
    await expect(page).toHaveURL(/\/receipts$/);

    const isEmpty = await page.getByTestId("receipts-empty-state").isVisible()
      .catch(() => false);
    if (isEmpty) {
      await page.getByTestId("add-receipt-empty-button").click();
    } else {
      await page.getByTestId("add-receipt-button").click();
    }
    await page.getByTestId("receipt-text-input").fill(SAMPLE_EMAIL_BODY);
    await page.getByTestId("receipt-entry-save").click();

    // Failed-state card surfaces with the Try again button.
    await expect(page.getByTestId("receipt-failed-card")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId("receipt-retry-button")).toBeVisible();

    // Clean up: delete the failed receipt.
    await page.getByTestId("receipt-delete-button").click();
    await expect(page).toHaveURL(/\/receipts$/);
  });
});
