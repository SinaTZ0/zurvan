// Captures the Admin Dashboard (F11): its blocks (waiting for her, enrollments, money, courses) and three of its numbers
// opening their lists already filtered. Usage: node scripts/feature-boards/10-admin-dashboard.capture.mjs [base-url]
import { ADMIN_PHONE, createCapture } from "./capture-lib.mjs";

const { go, shoot, signIn, finish } = await createCapture({ board: "10-admin-dashboard" });

/** A block of the dashboard, by its heading's id. */
const block = (page, id) => page.locator(`section[aria-labelledby=${id}]`);

/** Where an element starts on the page, in CSS px. */
const pageY = (locator) => locator.evaluate((el) => Math.round(el.getBoundingClientRect().top + scrollY));

const { context, page } = await signIn({ phone: ADMIN_PHONE });

/*===== 1. Waiting for her =====*/
await go(page, "/admin");
const waiting = block(page, "overview-waiting-title");
const evaluationsLink = waiting.locator("a[href^='/admin/evaluations']").first();
const flaggedLink = waiting.locator("a[href*='view=flagged']").first();
await shoot(
  page,
  "01-waiting",
  {
    title: page.locator("h1").first(),
    evaluations: evaluationsLink,
    flagged: flaggedLink,
    latest: page.getByText("آخرین خریدها").first(),
    all: page.getByRole("link", { name: "همه‌ی پرداخت‌ها" }),
    call: waiting.getByRole("link", { name: /^زنگ به/ }).first(),
  },
  { maxHeight: (await pageY(page.locator("#overview-enrollments-title"))) - 30 },
);

/*===== 4. Enrollments, money and courses (shot before the clicks) =====*/
const numbersTop = (await pageY(page.locator("#overview-enrollments-title"))) - 30;
const enrollments = block(page, "overview-enrollments-title");
const money = block(page, "overview-money-title");
const courses = block(page, "overview-courses-title");
const coursesBottom = await courses.evaluate((el) => Math.round(el.getBoundingClientRect().bottom + scrollY));
await shoot(
  page,
  "04-numbers",
  {
    // «در حال آموزش» is the list's default filter, so its link leaves it out of the address.
    active: enrollments.locator("a").first(),
    finished: enrollments.locator("a[href*='status=completed']"),
    cancelled: enrollments.locator("a[href*='status=cancelled']"),
    month: money.locator("a").first(),
    total: money.locator("a").nth(1),
    commissions: money.locator("a[href^='/admin/partners']"),
    courses: courses.locator("li, article").first(),
    coursesTitle: page.locator("#overview-courses-title"),
  },
  { top: numbersTop, maxHeight: Math.min(coursesBottom - numbersTop + 20, 960) },
);

/*===== 2. The evaluation requests =====*/
await evaluationsLink.click();
await page.waitForURL(/\/admin\/evaluations/);
await page.waitForLoadState("networkidle");
await shoot(
  page,
  "02-evaluations",
  {
    title: page.locator("h1").first(),
    pill: page.locator("fieldset button[aria-pressed=true]").first(),
    first: page.locator("main li").first(),
  },
  { maxHeight: 480 },
);

/*===== 3. Paid, not enrolled =====*/
await go(page, "/admin");
await flaggedLink.click();
await page.waitForURL(/\/admin\/payments/);
await page.waitForLoadState("networkidle");
await shoot(
  page,
  "03-flagged",
  {
    title: page.locator("h1").first(),
    pill: page.locator("fieldset button[aria-pressed=true]").first(),
    first: page.locator("main li, main article").first(),
  },
  { maxHeight: 1000 },
);

/*===== 5. Active enrollments =====*/
await go(page, "/admin");
await block(page, "overview-enrollments-title").locator("a").first().click();
await page.waitForURL(/\/admin\/enrollments/);
await page.waitForLoadState("networkidle");
await shoot(
  page,
  "05-enrollments",
  {
    title: page.locator("h1").first(),
    pill: page.locator("fieldset button[aria-pressed=true]").first(),
    first: page.locator("main article").first(),
  },
  { maxHeight: 620 },
);

/*===== 6. Unpaid commissions =====*/
await go(page, "/admin");
await block(page, "overview-money-title").locator("a[href^='/admin/partners']").click();
await page.waitForURL(/\/admin\/partners/);
await page.waitForLoadState("networkidle");
await shoot(
  page,
  "06-commissions",
  {
    title: page.locator("h1").first(),
    pill: page.locator("fieldset button[aria-pressed=true]").first(),
    first: page.locator("main article, main li").first(),
  },
  { maxHeight: 1300 },
);
await context.close();

await finish();
