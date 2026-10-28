// Steps of a customer's journey that later boards need done but don't show: introducing a dog, requesting its free
// evaluation and the Admin marking it, all through the site's own pages (no database writes), so a board's capture can
// set up its own customer and dog from scratch.
import { ADMIN_PHONE } from "./capture-lib.mjs";

/*===== Dog =====*/
/**
 * Introduces a dog through the four-step form, filling only what's required (a purebred dog of an approximate age), and
 * waits for «سگ‌های من».
 *
 * @param go The capture's `go`.
 * @param ageYears The approximate age's years, as the select lists them (0 for under a year).
 * @param ageMonths The approximate age's extra months.
 * @param photo An optional photo file for the dog's card.
 * @returns The new dog's id.
 */
export async function addDog({ page, go, name, sex = "نر", breed, ageYears, ageMonths = 0, weight = "20", photo }) {
  await go(page, "/account/dogs/new");
  await page.locator("#dog-name").waitFor();
  await page.waitForLoadState("networkidle");

  /*------ Who it is ------*/
  if (photo) {
    await page.locator("input[type=file]").first().setInputFiles(photo);
    await page.getByRole("button", { name: "حذف عکس" }).waitFor();
  }
  await page.locator("#dog-name").fill(name);
  await page.getByText(sex, { exact: true }).click();
  await page.getByText("حدودی می‌دونم").click();
  await page.locator("select[name=ageYears]").selectOption({ value: String(ageYears) });
  await page.locator("select[name=ageMonths]").selectOption({ value: String(ageMonths) });
  await page.getByText("خالص", { exact: true }).click();
  await page.locator("#dog-breed").fill(breed);
  await page.locator("#dog-name").click(); // closes the breed suggestions
  await page.getByRole("button", { name: "بعدی" }).click();

  /*------ Body, then the two optional steps ------*/
  await page.locator("#dog-weight").waitFor();
  await page.locator("#dog-weight").fill(weight);
  await page.locator("label", { hasText: /^نه$/ }).click();
  await page.getByRole("button", { name: "بعدی" }).click();
  await page.locator("#dog-microchip").waitFor();
  await page.getByRole("button", { name: "بعدی" }).click();
  await page.locator("#dog-problems").waitFor();
  await page.getByRole("button", { name: "اضافه کن" }).click();
  await page.waitForURL((url) => url.pathname === "/account");
  await page.waitForLoadState("networkidle");

  /*------ Its id, from its record link ------*/
  const href = await page
    .getByRole("link", { name: new RegExp(`همه‌ی سابقه‌ی.*${name}`) })
    .first()
    .getAttribute("href");
  return href.split("/").pop();
}

/*===== Evaluation =====*/
/**
 * Marks a dog evaluated from the Admin's dog page (the way she marks a dog she already knows), on a fresh signed-in
 * Admin page that is closed afterwards.
 *
 * @param signIn The capture's `signIn`.
 */
export async function adminMarkEvaluated({ signIn, go, dogId }) {
  const { context, page } = await signIn({ phone: ADMIN_PHONE });
  await go(page, `/admin/dogs/${dogId}`);
  await page.getByRole("button", { name: "ارزیابی شد" }).first().click();
  // Its confirmation dialog has the same button.
  const dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: "ارزیابی شد" }).click();
  await dialog.waitFor({ state: "detached" });
  await page.waitForLoadState("networkidle");
  await context.close();
}

/*===== Images =====*/
/**
 * Scrolls through the page so its lazy images start loading, then waits until every image has decoded (or a few
 * seconds pass): a full-page shot otherwise catches the blurred placeholders further down.
 */
export async function loadImages(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });
  await page
    .waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(800);
}
