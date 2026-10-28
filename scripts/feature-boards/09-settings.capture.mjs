// Captures the Admin's settings (F10): the commission steps, the deposit (set to 50% and what the customer's cart then
// says, then back to the default) and the sign-in code limits.
// Usage: node scripts/feature-boards/09-settings.capture.mjs [base-url]
// It changes the live settings and puts them back to their defaults at the end, so run it on its own.
import { ADMIN_PHONE, box, createCapture } from "./capture-lib.mjs";
import { freshPhone } from "./board-lib.mjs";
import { addDog, adminMarkEvaluated } from "./journey-lib.mjs";
import { addToCart } from "./purchase-lib.mjs";

const { go, shoot, signIn, finish } = await createCapture({ board: "09-settings" });

const CUSTOMER = { first: "سمیرا", last: "یوسفی" };
const DOG = "لونا";

/** The settings card that holds `input`, as a locator. */
const cardOf = (input) => input.locator("xpath=ancestor::form[1]");

/** Where a settings section starts on the page, a little above its heading, for a shot that starts there. */
async function sectionTop(page, heading) {
  return Math.max(0, (await box(page, page.getByRole("heading", { name: heading, exact: true }).first())).y - 24);
}

/*===== Setup: a customer with an evaluated dog and a course in the cart =====*/
// Signed in before the limits go back to their defaults below, while the session's raised limit still allows it.
const { context: customerContext, page: customer } = await signIn({ phone: freshPhone(), name: CUSTOMER });
const dogId = await addDog({ page: customer, go, name: DOG, sex: "ماده", breed: "بیگل", ageYears: 1 });
await adminMarkEvaluated({ signIn, go, dogId });
await addToCart({ page: customer, go, slug: "house-manner", dogName: DOG });

const { context, page } = await signIn({ phone: ADMIN_PHONE });

/*------ The sign-in code limits back to their defaults ------*/
await go(page, "/admin/settings");
for (const id of ["otp_requests_per_phone_per_hour", "otp_requests_per_ip_per_hour"]) {
  const reset = cardOf(page.locator(`#setting-${id}`)).getByRole("button", { name: "برگردوندن به پیش‌فرض" });
  if (await reset.isEnabled()) {
    // The reset fills in the default; «ذخیره» saves it.
    await reset.click();
    await cardOf(page.locator(`#setting-${id}`))
      .getByRole("button", { name: "ذخیره" })
      .click();
    await page.waitForTimeout(1500);
  }
}

/*===== 1. The way in: «بیشتر» → «تنظیمات» =====*/
await go(page, "/admin");
await page.getByRole("button", { name: /بیشتر/ }).last().click();
await page.getByRole("link", { name: "تنظیمات" }).waitFor();
await page.waitForTimeout(600);
await shoot(page, "01-menu", { settings: page.getByRole("link", { name: "تنظیمات" }) }, { maxHeight: 844 });

/*===== 2. The commission steps =====*/
await go(page, "/admin/settings");
const tiers = page.locator("input[name='tiers.0.percent']");
await shoot(
  page,
  "02-commission",
  {
    rules: page.getByRole("heading", { name: "پله‌های پورسانت همکار" }),
    last: page.locator("input[name='tiers.4.percent']"),
    first: tiers,
    example: page.getByText(/از خرید/).first(),
    save: cardOf(tiers).getByRole("button", { name: "ذخیره" }),
  },
  { maxHeight: 1500 },
);

/*===== 3. The deposit set to 50% =====*/
const deposit = page.locator("#setting-deposit_percent");
await deposit.fill("50");
// Disabled when an interrupted run already left it at 50.
const saveDeposit = cardOf(deposit).getByRole("button", { name: "ذخیره" });
if (await saveDeposit.isEnabled()) {
  await saveDeposit.click();
  await page.waitForTimeout(1500);
}
await go(page, "/admin/settings");
let top = await sectionTop(page, "پیش‌پرداخت");
await shoot(
  page,
  "03-deposit",
  {
    input: deposit,
    example: cardOf(deposit)
      .getByText(/از دوره‌ای/)
      .first(),
    changed: cardOf(deposit)
      .getByText(/آخرین تغییر/)
      .first(),
    reset: cardOf(deposit).getByRole("button", { name: "برگردوندن به پیش‌فرض" }),
  },
  { top, maxHeight: 760 },
);

/*===== 4. What the customer's cart says =====*/
await go(customer, "/account/cart");
await customer.getByRole("button", { name: "پرداخت" }).first().waitFor();
// The place is picked first, so «پرداخت» is ready and the shot is about the deposit.
await customer.getByText("منزل", { exact: true }).first().click();
await customer.waitForTimeout(1500);
top = await sectionTop(customer, "جمع سبد");
await shoot(
  customer,
  "04-cart",
  {
    due: customer.getByText(/پیش‌پرداخت ٪/).first(),
    pay: customer.getByRole("button", { name: "پرداخت" }).first(),
  },
  { top: Math.max(0, top - 30), maxHeight: 520 },
);
await customerContext.close();

/*===== 5. Back to the default =====*/
// Shot between the reset (which fills in 100) and «ذخیره» (which saves it).
await go(page, "/admin/settings");
await cardOf(deposit).getByRole("button", { name: "برگردوندن به پیش‌فرض" }).click();
await page.waitForTimeout(800);
top = await sectionTop(page, "پیش‌پرداخت");
await shoot(
  page,
  "05-deposit-default",
  {
    input: deposit,
    reset: cardOf(deposit).getByRole("button", { name: "برگردوندن به پیش‌فرض" }),
    save: cardOf(deposit).getByRole("button", { name: "ذخیره" }),
  },
  { top, maxHeight: 760 },
);
await cardOf(deposit).getByRole("button", { name: "ذخیره" }).click();
await page.waitForTimeout(1500);

/*===== 6. The sign-in code limits =====*/
await go(page, "/admin/settings");
top = await sectionTop(page, "کد ورود پیامکی");
const perPhone = page.locator("#setting-otp_requests_per_phone_per_hour");
const perIp = page.locator("#setting-otp_requests_per_ip_per_hour");
await shoot(page, "06-codes", { perPhone, perIp, fixed: page.getByText(/طول کد/).first() }, { top, maxHeight: 1250 });
await context.close();

await finish();
