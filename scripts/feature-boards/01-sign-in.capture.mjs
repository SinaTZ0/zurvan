// Captures the sign-up / sign-in journey at phone width and records the page-space boxes of the controls the board
// points at. Usage: node scripts/feature-boards/01-sign-in.capture.mjs [base-url]
import { ADMIN_PHONE, DEMO_CODE, createCapture } from "./capture-lib.mjs";
import { freshPhone } from "./board-lib.mjs";

const { go, newPage, shoot, signIn, signInWithCode, finish } = await createCapture({ board: "01-sign-in" });

// A fresh number each run, so the sign-up path always meets a new account.
const NEW_PHONE = freshPhone();
const NEW_FIRST = "رضا";
const NEW_LAST = "کریمی";
const RETURNING_PHONE = "09120000004"; // سارا محمدی, two dogs

/*===== Sign-up (a new number) =====*/
{
  const { context, page } = await newPage();

  /*------ Home: the account button in the app bar ------*/
  await go(page, "/");
  await shoot(page, "01-home", { account: page.getByRole("link", { name: "ورود یا ثبت‌نام" }) }, { maxHeight: 844 });

  /*------ Phone step ------*/
  await page.getByRole("link", { name: "ورود یا ثبت‌نام" }).click();
  await page.locator("#sign-in-phone").waitFor();
  await page.waitForLoadState("networkidle");
  await page.locator("#sign-in-phone").fill(NEW_PHONE);
  await shoot(page, "02-phone", {
    stage: page.locator("main > div").nth(1),
    phone: page.locator("#sign-in-phone"),
    send: page.getByRole("button", { name: "کد ورود رو بفرست" }),
    password: page.getByRole("button", { name: "ورود با رمز عبور" }),
    demo: page.locator('[aria-labelledby="demo-accounts-title"]'),
  });

  /*------ Code step ------*/
  await page.getByRole("button", { name: "کد ورود رو بفرست" }).click();
  await page.getByText("ویرایش شماره").waitFor();
  await shoot(page, "03-code", {
    otp: page.locator("[data-input-otp-container], [data-slot=input-otp]"),
    hint: page.getByText("12345").or(page.getByText("۱۲۳۴۵")),
    resend: page.getByText(/ارسال دوباره/),
    edit: page.getByText("ویرایش شماره"),
  });

  /*------ Name step (only a new number gets here) ------*/
  await page.keyboard.type(DEMO_CODE);
  await page.locator("#sign-in-first-name").waitFor();
  await page.locator("#sign-in-first-name").fill(NEW_FIRST);
  await page.locator("#sign-in-last-name").fill(NEW_LAST);
  await shoot(page, "04-name", {
    created: page.getByText("حسابت ساخته شد"),
    first: page.locator("#sign-in-first-name"),
    last: page.locator("#sign-in-last-name"),
    next: page.getByRole("button", { name: "ادامه" }),
  });

  /*------ The new customer's account ------*/
  await page.getByRole("button", { name: "ادامه" }).click();
  await page.waitForURL(/\/account/);
  await page.waitForLoadState("networkidle");
  // One phone screen: a full-page shot strands the fixed tab bar mid-page.
  await shoot(
    page,
    "05-account-new",
    {
      main: page.locator("main").first(),
      heading: page.locator("h1").first(),
      tabs: page.getByRole("link", { name: "سگ‌های من" }).last(),
    },
    { maxHeight: 844 },
  );
  await context.close();
}

/*===== Sign-in (a returning customer) =====*/
{
  const { context, page } = await newPage();
  await go(page, "/auth");
  await page.locator('[aria-labelledby="demo-accounts-title"] button').first().waitFor();
  await page.locator('[aria-labelledby="demo-accounts-title"] button', { hasText: "سارا" }).click();
  await signInWithCode(page, RETURNING_PHONE);
  await page.keyboard.type(DEMO_CODE);
  await page.waitForURL(/\/account/);
  await page.waitForLoadState("networkidle");
  // One phone screen: a full-page shot strands the fixed tab bar mid-page.
  await shoot(
    page,
    "06-account-returning",
    {
      main: page.locator("main").first(),
      heading: page.locator("h1").first(),
      tabs: page.getByRole("link", { name: "سگ‌های من" }).last(),
    },
    { maxHeight: 844 },
  );
  await context.close();
}

/*===== Admin: the new account appears on the Users page =====*/
{
  const { context, page } = await signIn({ phone: ADMIN_PHONE });
  await go(page, `/admin/users?q=${encodeURIComponent(NEW_LAST)}`);
  await shoot(
    page,
    "07-admin-users",
    { row: page.getByText(`${NEW_FIRST} ${NEW_LAST}`), heading: page.locator("h1").first() },
    { maxHeight: 1200 },
  );
  await context.close();
}

await finish({ newPhone: NEW_PHONE });
