import { expect, test } from "@playwright/test";

test("signed-out visitors land on the auth page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page).toHaveTitle("ورود به آموزش K9");
});
