// Steps that boards about what follows an evaluation or a purchase (partners, notifications) need done: requesting a
// dog's free evaluation, the Admin answering it from the Evaluations page, and buying a course through the cart and the
// demo gateway. All through the site's own pages (no database writes); the caller decides what to shoot.

/*===== Evaluation =====*/
/**
 * Sends a dog's free evaluation request from the Evaluation Request page: the dog, an earliest date and when the
 * customer is usually free. Waits for the receipt.
 *
 * @param go The capture's `go`.
 * @param dogName Picks the dog when the customer has more than one.
 */
export async function requestEvaluation({ page, go, dogName }) {
  await go(page, "/assessment");
  await page.locator("select[name=earliestDay]").waitFor();
  const dog = page.locator("label", { hasText: dogName }).filter({ has: page.locator("input[name=dogId]") });
  if (await dog.count()) await dog.first().click();
  await page.locator("select[name=earliestDay]").selectOption({ index: 10 });
  await page.locator("select[name=earliestMonth]").selectOption({ index: 9 });
  await page.locator("select[name=earliestYear]").selectOption({ index: 1 });
  await page.locator("label", { hasText: /^شنبه$/ }).click();
  await page.locator("label", { hasText: /^عصر و شب$/ }).click();
  await page.getByRole("button", { name: "درخواست ارزیابی رایگان" }).click();
  await page.locator("#receipt-title").waitFor();
  await page.waitForLoadState("networkidle");
}

/**
 * The Admin answers a waiting evaluation request from the Evaluations page: «ارزیابی شد», or «رد» with a reason. The
 * page is the Admin's, already signed in.
 *
 * @param outcome `"evaluate"` or `"reject"`.
 * @param reason The rejection's reason (sent to the customer by SMS).
 */
export async function answerEvaluation({ page, go, dogName, outcome, reason }) {
  await go(page, "/admin/evaluations");
  await page.getByText(dogName, { exact: true }).first().click();
  await page.waitForURL(/evaluation=/);
  if (outcome === "evaluate") {
    await page.getByRole("button", { name: "ارزیابی شد" }).last().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "ارزیابی شد" }).click();
  } else {
    await page.getByRole("button", { name: "رد", exact: true }).click();
    await page.locator("#reject-reason").fill(reason);
    await page.getByRole("button", { name: "رد کن" }).click();
  }
  await page
    .getByText(/ارزیابی‌اش کردی|ردش کردی/)
    .first()
    .waitFor();
  await page.waitForLoadState("networkidle");
}

/*===== Purchase =====*/
/**
 * Puts a course for a dog in the cart from the course's page.
 *
 * @param slug The course's address, e.g. `house-manner`.
 * @param dogName Picks the dog when the customer has more than one.
 */
export async function addToCart({ page, go, slug, dogName }) {
  await go(page, `/courses/${slug}`);
  const dog = page.locator("label", { hasText: dogName }).filter({ has: page.locator("input[name=course-dog]") });
  if (await dog.count()) await dog.first().click();
  await page.getByRole("button", { name: "افزودن به سبد" }).first().click();
  await page
    .getByText("در سبد است")
    .first()
    .waitFor({ timeout: 10000 })
    .catch(() => {});
  await page.waitForLoadState("networkidle");
}

/**
 * Pays for the cart through the demo gateway, which returns straight to the cart with the result; picks `place` for
 * every item that asks where it is taught. Waits for the paid banner.
 *
 * @param place A place's label as the cart shows it, e.g. «منزل».
 */
export async function payCart({ page, go, place = "منزل" }) {
  await go(page, "/account/cart");
  const places = page.locator("label", { hasText: new RegExp(`^${place}$`) });
  for (let i = 0; i < (await places.count()); i += 1) await places.nth(i).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "پرداخت", exact: true }).click();
  await page
    .getByText(/پرداخت انجام شد/)
    .first()
    .waitFor({ timeout: 30000 });
  await page.waitForLoadState("networkidle");
}
