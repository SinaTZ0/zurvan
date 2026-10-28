// Captures buying a course (F5): adding it for an evaluated dog, picking where it's taught in the cart (boarding and its
// note), the optional «کی هماهنگ کنیم؟», paying through the demo gateway, the Purchases page and the Admin's Payments.
// Usage: node scripts/feature-boards/05-cart-checkout.capture.mjs [base-url]
import { ADMIN_PHONE, createCapture } from "./capture-lib.mjs";
import { freshPhone } from "./board-lib.mjs";
import { addDog, adminMarkEvaluated, loadImages } from "./journey-lib.mjs";

const { go, shoot, signIn, finish } = await createCapture({ board: "05-cart-checkout" });

const OWNER_PHONE = freshPhone();
const OWNER = { first: "زهرا", last: "حسینی" };
const DOG = "جکی";
const COURSE = "companion-1";

/*===== The customer and her evaluated dog =====*/
const { context, page } = await signIn({ phone: OWNER_PHONE, name: OWNER });
const dogId = await addDog({
  page,
  go,
  name: DOG,
  breed: "ژرمن شپرد",
  ageYears: 1,
  ageMonths: 2,
  weight: "30",
  photo: "app/db/seed-images/dog-leo.jpg",
});
await adminMarkEvaluated({ signIn, go, dogId });

/*------ Helpers ------*/
const yOf = async (locator) => (await locator.first().boundingBox()).y + (await page.evaluate(() => window.scrollY));
const place = (value) => page.locator(`input[name=cart-place-${dogId}-${COURSE}][value=${value}]`).locator("xpath=..");
const boardingNote = page.getByText(/هزینه‌ی پانسیون جداست/);
const whenTitle = page.locator("#cart-when-free-title");
const pay = page.getByRole("button", { name: "پرداخت", exact: true }).first();

/*------ 1. Added on the course page ------*/
await go(page, `/courses/${COURSE}`);
await loadImages(page);
await page.locator(`input[name=course-dog][value="${dogId}"]`).locator("xpath=..").click();
await page.getByRole("button", { name: "افزودن به سبد" }).first().click();
await page.getByText("در سبد است").first().waitFor();
await page.waitForTimeout(1000);
{
  const bottom = (await yOf(page.getByRole("link", { name: "خرید چطوری کار می‌کنه؟" }))) + 50;
  await shoot(
    page,
    "01-added",
    {
      cart: page.getByRole("link", { name: /سبد/ }).first(),
      place: page.getByText("محل آموزش", { exact: true }).first().locator("xpath=.."),
      dog: page.locator(`input[name=course-dog][value="${dogId}"]`).locator("xpath=.."),
      inCart: page.getByText("در سبد است").first(),
      open: page.getByRole("link", { name: "دیدن سبد" }).first(),
    },
    { maxHeight: bottom },
  );
}

/*------ 2. The cart, place not picked yet ------*/
await go(page, "/account/cart");
await pay.waitFor();
await page.waitForTimeout(1000);
{
  const bottom = (await yOf(page.getByRole("link", { name: "افزودن دوره‌ی دیگر" }))) + 70;
  await shoot(
    page,
    "02-cart",
    {
      item: page.getByRole("heading", { name: "سگ همدم ۱" }).first(),
      places: place("home").locator("xpath=ancestor::fieldset[1]"),
      pay,
      missing: page.getByText(/هنوز جای آموزش رو انتخاب نکردی/).first(),
    },
    { maxHeight: bottom },
  );
}

/*------ 3. Boarding picked ------*/
await place("boarding").click();
await boardingNote.first().waitFor();
await page.waitForTimeout(1000);
{
  const note = boardingNote.first();
  const bottom = (await yOf(note)) + (await note.boundingBox()).height + 40;
  await shoot(
    page,
    "03-place",
    {
      boarding: place("boarding"),
      note: boardingNote.first(),
    },
    { maxHeight: bottom },
  );
}

/*------ 4. «کی هماهنگ کنیم؟» and «پرداخت» ------*/
for (const day of ["شنبه", "سه‌شنبه"]) await page.locator("label", { hasText: new RegExp(`^${day}$`) }).click();
await page.locator("label", { hasText: /^صبح$/ }).click();
await page.waitForTimeout(1000);
{
  const top = (await yOf(whenTitle)) - 115;
  const bottom = (await yOf(page.getByRole("link", { name: "افزودن دوره‌ی دیگر" }))) + 70;
  await shoot(
    page,
    "04-when-pay",
    {
      when: whenTitle,
      days: page.locator("input[name=availableDays]").first().locator("xpath=ancestor::fieldset[1]"),
      periods: page.locator("input[name=availablePeriods]").first().locator("xpath=ancestor::fieldset[1]"),
      total: boardingNote.last(),
      pay,
    },
    { top, maxHeight: bottom - top },
  );
}

/*------ 5. Back from the gateway ------*/
await pay.click();
await page
  .getByText(/پرداخت انجام شد/)
  .first()
  .waitFor({ timeout: 30000 });
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1000);
{
  const bottom = (await yOf(page.getByText("بعدش چی می‌شه؟").first())) + 330;
  await shoot(
    page,
    "05-paid",
    {
      banner: page.getByText(/پرداخت انجام شد/).first(),
      purchases: page.getByRole("link", { name: "دیدن خریدها" }).first(),
      next: page.getByText("بعدش چی می‌شه؟").first(),
    },
    { maxHeight: bottom },
  );
}

/*------ 6. Purchases ------*/
await go(page, "/account/purchases");
await loadImages(page);
{
  const bottom = (await yOf(page.getByText(/^جمع ۱ دوره/).first())) + 60;
  await shoot(
    page,
    "06-purchases",
    {
      paid: page.getByText("پرداخت شد", { exact: true }).first(),
      when: page.getByText(/وقت‌های آزاد برای هماهنگی/).first(),
      place: page.locator("span:has(> span.sr-only)", { hasText: "پانسیون" }).first(),
      note: boardingNote.first(),
      status: page.getByText("در حال آموزش", { exact: true }).last(),
    },
    { maxHeight: bottom },
  );
}
await context.close();

/*===== 7. The Admin's Payments =====*/
{
  const { context: admin, page: panel } = await signIn({ phone: ADMIN_PHONE });
  await go(panel, "/admin/payments");
  const call = panel.getByRole("link", { name: new RegExp(`زنگ به ${OWNER.first} ${OWNER.last}`) }).first();
  await call.waitFor();
  // The payment's own card: the nearest block around the call link that has its «ثبت بازپرداخت».
  const payment = call.locator("xpath=ancestor::*[.//button[contains(., 'ثبت بازپرداخت')]][1]");
  const box = await payment.boundingBox();
  const bottom = box.y + (await panel.evaluate(() => window.scrollY)) + box.height + 20;
  await shoot(
    panel,
    "07-admin-payments",
    {
      tabs: panel.getByRole("button", { name: /^همه/ }).first(),
      call,
      when: payment.getByText(/وقت‌های آزاد برای هماهنگی/).first(),
      place: payment.locator("span:has(> span.sr-only)", { hasText: "پانسیون" }).first(),
      status: payment.getByText("در حال آموزش", { exact: true }).first(),
      refund: payment.getByRole("button", { name: "ثبت بازپرداخت" }),
    },
    { maxHeight: bottom },
  );
  await admin.close();
}

await finish({ ownerPhone: OWNER_PHONE, dogId });
