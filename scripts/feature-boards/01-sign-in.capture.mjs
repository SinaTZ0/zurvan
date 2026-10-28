// Captures the sign-up / sign-in journey at phone width (390×844, DPR 2) and records the page-space boxes of the
// controls the board points at. Usage: node scripts/feature-boards/01-sign-in.capture.mjs [base-url]
// The base URL defaults to the live site, which runs in demo mode (every SMS code is 12345).
import { writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = (process.argv[2] ?? "https://k9training.zurvann.ir").replace(/\/$/, "");
const OUT = ".tmp-claude/feature-boards/01-sign-in/shots";
mkdirSync(OUT, { recursive: true });

// A fresh number each run, so the sign-up path always meets a new account.
const NEW_PHONE = `0935${String(Math.floor(Math.random() * 1e7)).padStart(7, "0")}`;
const NEW_FIRST = "رضا";
const NEW_LAST = "کریمی";
const RETURNING_PHONE = "09120000004"; // سارا محمدی, two dogs
const ADMIN_PHONE = "09120000001";

const browser = await chromium.launch();
const errors = [];
const shots = {};

async function newPage() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
    locale: "fa-IR",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return { context, page };
}

/** Page-space box of the first match (so it lines up with a full-page shot). */
async function box(page, locator) {
  if ((await locator.count()) === 0) return null;
  const b = await locator.first().boundingBox();
  if (!b) return null;
  const scrollY = await page.evaluate(() => window.scrollY);
  return { x: b.x, y: b.y + scrollY, w: b.width, h: b.height };
}

/** Screenshot, full page but cut at `maxHeight` CSS px, plus the named boxes. */
async function shoot(page, name, targets, { maxHeight = 1700 } = {}) {
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  const boxes = {};
  for (const [key, locator] of Object.entries(targets)) boxes[key] = await box(page, locator);
  const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const height = Math.min(fullHeight, maxHeight);
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    fullPage: true,
    clip: { x: 0, y: 0, width: 390, height },
    animations: "disabled",
  });
  shots[name] = { width: 390, height, fullHeight, url: page.url().replace(BASE, ""), boxes };
}

async function signInWithCode(page, phone) {
  await page.locator("#sign-in-phone").fill(phone);
  await page.getByRole("button", { name: "کد ورود رو بفرست" }).click();
  await page.locator('input[autocomplete="one-time-code"], [data-input-otp]').first().waitFor();
}

/*===== Sign-up (a new number) =====*/
{
  const { context, page } = await newPage();

  /*------ Home: the account button in the app bar ------*/
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
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
  await page.keyboard.type("12345");
  await page.locator("#sign-in-first-name").waitFor();
  await page.locator("#sign-in-first-name").fill(NEW_FIRST);
  await page.locator("#sign-in-last-name").fill(NEW_LAST);
  await shoot(page, "04-name", {
    created: page.getByText("حسابت ساخته شد"),
    first: page.locator("#sign-in-first-name"),
    last: page.locator("#sign-in-last-name"),
    rules: page.locator("#sign-in-rules"),
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
    { main: page.locator("main").first(), heading: page.locator("h1").first(), tabs: page.getByRole("link", { name: "سگ‌های من" }).last() },
    { maxHeight: 844 },
  );
  await context.close();
}

/*===== Sign-in (a returning customer) =====*/
{
  const { context, page } = await newPage();
  await page.goto(`${BASE}/auth`, { waitUntil: "networkidle" });
  await page.locator('[aria-labelledby="demo-accounts-title"] button').first().waitFor();
  await page.locator('[aria-labelledby="demo-accounts-title"] button', { hasText: "سارا" }).click();
  await signInWithCode(page, RETURNING_PHONE);
  await page.keyboard.type("12345");
  await page.waitForURL(/\/account/);
  await page.waitForLoadState("networkidle");
  // One phone screen: a full-page shot strands the fixed tab bar mid-page.
  await shoot(
    page,
    "06-account-returning",
    { main: page.locator("main").first(), heading: page.locator("h1").first(), tabs: page.getByRole("link", { name: "سگ‌های من" }).last() },
    { maxHeight: 844 },
  );
  await context.close();
}

/*===== Admin: the new account appears on the Users page =====*/
{
  const { context, page } = await newPage();
  await page.goto(`${BASE}/auth`, { waitUntil: "networkidle" });
  await signInWithCode(page, ADMIN_PHONE);
  await page.keyboard.type("12345");
  await page.waitForURL(/\/admin/);
  await page.goto(`${BASE}/admin/users?q=${encodeURIComponent(NEW_LAST)}`, { waitUntil: "networkidle" });
  await shoot(
    page,
    "07-admin-users",
    { row: page.getByText(`${NEW_FIRST} ${NEW_LAST}`), heading: page.locator("h1").first() },
    { maxHeight: 1200 },
  );
  await context.close();
}

writeFileSync(`${OUT}/shots.json`, JSON.stringify({ newPhone: NEW_PHONE, shots }, null, 2));
console.log(errors.length ? `console errors:\n${errors.join("\n")}` : "no console errors");
console.log(JSON.stringify(shots, null, 1));
await browser.close();
