import { expect, test } from "@playwright/test";
import sharp from "sharp";

import {
  clearGeminiFixture,
  setGeminiHappy,
} from "../helpers/gemini-mock";

const EMAIL = process.env.SEED_USER_EMAIL ?? "";
const PASSWORD = process.env.SEED_USER_PASSWORD ?? "";

const PARSED_HAPPY = {
  merchant: "Maxima",
  date: "2026-05-30",
  totalCents: 535,
  lineItems: [
    {
      name: "Pienas",
      quantity: 1,
      unit: null,
      unitPriceCents: 129,
      lineTotalCents: 129,
    },
    {
      name: "Duona",
      quantity: 1,
      unit: null,
      unitPriceCents: 189,
      lineTotalCents: 189,
    },
    {
      name: "Sūris",
      quantity: 1,
      unit: null,
      unitPriceCents: 219,
      lineTotalCents: 219,
    },
    {
      name: "ACIU nuolaida prekei",
      quantity: 1,
      unit: null,
      unitPriceCents: null,
      lineTotalCents: -2,
    },
  ],
};

async function makeSamplePhoto(): Promise<Buffer> {
  // 240x320 synthetic receipt-ish JPEG. The sharp pipeline in the
  // server action will accept this and normalize it; Gemini's
  // response is mocked via the SDK-boundary bypass so the photo's
  // content does not need to be meaningful.
  return await sharp({
    create: {
      width: 240,
      height: 320,
      channels: 3,
      background: { r: 250, g: 247, b: 242 },
    },
  })
    .jpeg({ quality: 80 })
    .toBuffer();
}

test.describe("Phase 3 receipts, photo mode", () => {
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

  test("happy path: upload, normalize, parse, confirm, delete", async ({ page }) => {
    await setGeminiHappy(PARSED_HAPPY);
    const photo = await makeSamplePhoto();
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

    // Switch to the Photo tab.
    await expect(page.getByTestId("receipt-entry-sheet")).toBeVisible();
    await page.getByTestId("receipt-tab-photo").click();
    await expect(page.getByTestId("receipt-tab-photo")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Upload the synthetic photo.
    await page.getByTestId("receipt-photo-input").setInputFiles({
      name: "receipt.jpg",
      mimeType: "image/jpeg",
      buffer: photo,
    });
    await page.getByTestId("receipt-entry-save").click();

    // Land on the detail page with the photo evidence pane rendered.
    await expect(page).toHaveURL(/\/receipts\/[a-z0-9]+$/);
    await expect(page.getByTestId("receipt-photo")).toBeVisible({
      timeout: 10_000,
    });

    // Suspense resolves into the parsed review form.
    await expect(page.getByTestId("receipt-review-form")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId("receipt-merchant-input")).toHaveValue(
      "Maxima",
    );
    await expect(page.getByTestId("receipt-total")).toContainText("5,35");

    // Confirm and verify the badge transitions.
    await page.getByTestId("receipt-confirm-button").click();
    await expect(page.getByTestId("receipt-detail-status")).toContainText(
      "Confirmed",
      { timeout: 5000 },
    );

    // Delete via the read-only confirmed view.
    await page.getByTestId("receipt-delete-button").click();
    await expect(page).toHaveURL(/\/receipts$/);
  });
});
