// The shared parts of every capture script: a phone-sized browser page, full-page shots with the page-space boxes of
// the controls a board points at, signing in with the demo code, and writing `shots.json`.
// The base URL defaults to the live site, which runs in demo mode (every SMS code is 12345); pass a local copy's URL
// as the script's first argument to capture that instead.
import { writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

export const LIVE_SITE = "https://k9training.zurvann.ir";
export const DEMO_CODE = "12345";
export const ADMIN_PHONE = "09120000001";
export const PHONE = { width: 390, height: 844 };

/*===== Page Helpers =====*/
/** Page-space box of the first match (so it lines up with a full-page shot). */
export async function box(page, locator) {
  if ((await locator.count()) === 0) return null;
  const b = await locator.first().boundingBox();
  if (!b) return null;
  const scrollY = await page.evaluate(() => window.scrollY);
  return { x: b.x, y: b.y + scrollY, w: b.width, h: b.height };
}

/** Asks for a sign-in code on the sign-in page, and waits for the code boxes. */
export async function signInWithCode(page, phone) {
  await page.locator("#sign-in-phone").fill(phone);
  await page.getByRole("button", { name: "کد ورود رو بفرست" }).click();
  await page.locator('input[autocomplete="one-time-code"], [data-input-otp]').first().waitFor();
}

/*===== Capture =====*/
/**
 * Starts a capture for one board.
 *
 * @param board The board's file name without extension, e.g. `01-sign-in`; its shots go to
 *   `.tmp-claude/feature-boards/<board>/shots/`.
 * @param base The site's origin; defaults to the script's first argument, then the live site.
 */
export async function createCapture({ board, base = process.argv[2] ?? LIVE_SITE }) {
  const BASE = base.replace(/\/$/, "");
  const OUT = `.tmp-claude/feature-boards/${board}/shots`;
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const errors = [];
  const shots = {};

  /** A fresh phone-sized context (its own cookies), in Persian with reduced motion. */
  async function newPage({ locale = "fa-IR" } = {}) {
    const context = await browser.newContext({
      viewport: PHONE,
      deviceScaleFactor: 2,
      reducedMotion: "reduce",
      locale,
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    return { context, page };
  }

  /** Opens a path on the site and waits for it to settle. */
  async function go(page, path) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  }

  /**
   * Screenshot, full page but cut at `maxHeight` CSS px, plus the named boxes. `top` starts the shot further down the
   * page (its boxes are then relative to that point).
   */
  async function shoot(page, name, targets, { maxHeight = 1700, top = 0 } = {}) {
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    const boxes = {};
    for (const [key, locator] of Object.entries(targets)) {
      const b = await box(page, locator);
      boxes[key] = b && { ...b, y: b.y - top };
    }
    const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const height = Math.min(fullHeight - top, maxHeight);
    await page.screenshot({
      path: `${OUT}/${name}.png`,
      fullPage: true,
      clip: { x: 0, y: top, width: PHONE.width, height },
      animations: "disabled",
    });
    shots[name] = { width: PHONE.width, height, fullHeight, url: page.url().replace(BASE, ""), boxes };
    const lost = Object.entries(boxes).filter(([, b]) => !b).map(([k]) => k);
    if (lost.length) console.warn(`${name}: not found: ${lost.join(", ")}`);
  }

  /**
   * Signs a phone number in from scratch on a new page: the code, then the name if the number is new.
   *
   * @param name `{ first, last }` for a new number; ignored for an existing account.
   * @returns The signed-in page and its context.
   */
  async function signIn({ phone, name, locale } = {}) {
    const { context, page } = await newPage({ locale });
    await go(page, locale === "en-US" ? "/en/auth" : "/auth");
    await page.locator("#sign-in-phone").waitFor();
    await signInWithCode(page, phone);
    await page.keyboard.type(DEMO_CODE);
    const firstName = page.locator("#sign-in-first-name");
    await Promise.race([
      firstName.waitFor().catch(() => {}),
      page.waitForURL((url) => !/\/auth/.test(url.pathname), { timeout: 20000 }).catch(() => {}),
    ]);
    if (/\/auth/.test(new URL(page.url()).pathname) && (await firstName.count())) {
      await firstName.fill(name.first);
      await page.locator("#sign-in-last-name").fill(name.last);
      await page.locator("#sign-in-last-name").press("Enter");
      await page.waitForURL((url) => !/\/auth/.test(url.pathname));
    }
    await page.waitForLoadState("networkidle");
    return { context, page };
  }

  /** Writes `shots.json` (with any extra facts the board wants), reports console errors and closes the browser. */
  async function finish(extra = {}) {
    writeFileSync(`${OUT}/shots.json`, JSON.stringify({ ...extra, shots }, null, 2));
    console.log(errors.length ? `console errors:\n${errors.join("\n")}` : "no console errors");
    console.log(Object.keys(shots).join(", "));
    await browser.close();
  }

  return { BASE, OUT, browser, shots, errors, newPage, go, box, shoot, signInWithCode, signIn, finish };
}
