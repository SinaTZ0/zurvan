import { expect, test } from "@playwright/test";

/*===== Smoke Tests =====*/
// They run against the production build (`playwright.config.ts` builds and starts it) with a database that holds the
// course seed (`npm run db:seed`) and `SHOWCASE_MODE=true`, so the sign-in code is the public `12345` and no SMS is sent.
// They check that what a visitor and a new customer reach first works end to end: build, server, database and browser.

test.describe("a visitor", () => {
  test("sees the home page and the four-link menu", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    const menu = page.getByRole("navigation", { name: "منوی اصلی" });
    await expect(menu.getByRole("link")).toHaveText(["دوره‌ها", "درباره", "تماس", "راهنما"]);
  });

  test("finds a course by what it teaches", async ({ page }) => {
    // The search is in the header, behind its magnifier.
    await page.goto("/courses");
    await page.getByRole("button", { name: "جست‌وجوی دوره‌ها" }).click();
    await page.getByRole("searchbox").fill("igp");

    await expect(page.getByRole("main")).toContainText("ورزشی");
    await expect(page.getByRole("main")).not.toContainText("سگ خونگی");
  });

  test("reads the owner's business card on the contact page", async ({ page }) => {
    await page.goto("/contact");

    await expect(page.getByRole("main")).toContainText("۰۹۲۱۴۰۸۷۸۶۷");
    await expect(page.getByRole("main")).not.toContainText("k9training.ir");
  });

  test("is sent to sign in, and brought back, by the purchase page", async ({ page }) => {
    await page.goto("/buy");

    await expect(page).toHaveURL(/\/auth\?redirectTo=%2Fbuy$/);
  });

  test("gets an honest answer where nothing is published", async ({ page }) => {
    // No approved site rules exist, so there is no rules page.
    const rules = await page.goto("/rules");
    expect(rules?.status()).toBe(404);

    // A dog's record is private for everyone but its owner: a number nobody has reads the same as one somebody has.
    const record = await page.goto("/logbook/ZD-0000000000");
    expect(record?.headers()["cache-control"]).toContain("no-store");
    await expect(page.getByRole("main")).toContainText("این پرونده خصوصیه");
  });
});

test.describe("a new customer", () => {
  test("signs up with a code and reaches the cart and the purchase page", async ({ page }) => {
    // A number nobody used: sign-in and sign-up are the same two steps (code, then a name the first time).
    const phone = `0919${Math.floor(1_000_000 + Math.random() * 8_999_999)}`;
    await page.goto("/auth");
    await page.fill("#sign-in-phone", phone);
    await page.getByRole("button", { name: "کد ورود را بفرست" }).click();
    await page.locator("#sign-in-code").focus();
    await page.keyboard.type("12345", { delay: 60 });

    await page.fill("#sign-in-first-name", "تست");
    await page.fill("#sign-in-last-name", "دودی");
    await page.getByRole("button", { name: "ادامه" }).click();
    await expect(page).toHaveURL(/\/account/);

    await page.goto("/account/cart");
    await expect(page.getByRole("main")).toContainText("سبد خالیه");

    // No dog yet: the purchase page asks for one first and sends the customer back here afterwards.
    await page.goto("/buy");
    await expect(page.getByRole("main")).toContainText("اول سگت را معرفی کن");
    await expect(page.getByRole("link", { name: "معرفی سگ" })).toHaveAttribute(
      "href",
      "/account/dogs/new?redirectTo=%2Fbuy",
    );
  });
});
