// Captures the free evaluation (F3): a customer requests it for two dogs, the Admin marks one evaluated and rejects the
// other with a reason, and what the customer sees after each.
// Usage: node scripts/feature-boards/03-evaluation.capture.mjs [base-url]
import { ADMIN_PHONE, createCapture } from "./capture-lib.mjs";
import { freshPhone } from "./board-lib.mjs";
import { addDog, loadImages } from "./journey-lib.mjs";

const { go, shoot, signIn, finish } = await createCapture({ board: "03-evaluation" });

const OWNER_PHONE = freshPhone();
const OWNER = { first: "مریم", last: "کریمی" };
const EVALUATED = "تارا";
const REJECTED = "فندق";
const REASON = "سه بار زنگ زدم و جواب ندادید؛ هر وقت آماده بودید دوباره درخواست بدید.";

/*===== The customer and her two dogs =====*/
const { context, page } = await signIn({ phone: OWNER_PHONE, name: OWNER });
const taraId = await addDog({
  page,
  go,
  name: EVALUATED,
  sex: "ماده",
  breed: "ژرمن شپرد",
  ageYears: 1,
  ageMonths: 2,
  weight: "27",
  photo: "app/db/seed-images/dog-leo.jpg",
});
const fandoghId = await addDog({
  page,
  go,
  name: REJECTED,
  breed: "پامرانین",
  ageYears: 3,
  weight: "3",
  photo: "app/db/seed-images/dog-pesteh.jpg",
});

/**
 * Fills the request form for one dog: picks it, ticks the free days and times and adds a photo (the earliest date stays
 * today, as the form starts).
 */
async function fillRequest({ dogId, days, period, photo }) {
  await go(page, "/assessment");
  await page.locator(`input[name=dogId][value="${dogId}"]`).locator("xpath=..").click();
  for (const day of days) await page.locator("label", { hasText: new RegExp(`^${day}$`) }).click();
  await page.locator("label", { hasText: new RegExp(`^${period}$`) }).click();
  await page.locator("input[type=file]").first().setInputFiles(photo);
  await page.waitForTimeout(3000); // the upload
}

/** Sends the filled form and waits for the receipt. */
async function send() {
  await page.getByRole("button", { name: "درخواست ارزیابی رایگان" }).click();
  await page.locator("#receipt-title").waitFor();
  await page.waitForTimeout(1000);
}

/*------ 1. The request ------*/
await fillRequest({
  dogId: taraId,
  days: ["شنبه", "دوشنبه"],
  period: "عصر و شب",
  photo: "app/db/seed-images/dog-leo.jpg",
});
const filesPlate = page.locator("#plate-files-title").locator("xpath=ancestor::section[1]");
await shoot(
  page,
  "01-request",
  {
    dog: page.locator(`input[name=dogId][value="${taraId}"]`).locator("xpath=.."),
    other: page.locator(`input[name=dogId][value="${fandoghId}"]`).locator("xpath=.."),
    dateFrom: page.locator("select[name=earliestYear]"),
    dateTo: page.locator("select[name=earliestDay]"),
    days: page.locator("input[name=availableDays]").first().locator("xpath=ancestor::fieldset[1]"),
    periods: page.locator("input[name=availablePeriods]").first().locator("xpath=ancestor::fieldset[1]"),
    files: filesPlate.locator("img").last(),
    submit: page.getByRole("button", { name: "درخواست ارزیابی رایگان" }),
  },
  { maxHeight: 2560 },
);

/*------ 2. The receipt ------*/
await send();
await shoot(
  page,
  "02-receipt",
  {
    title: page.locator("h1").first(),
    road: page.getByText("زنگ طلا", { exact: true }).first(),
    receipt: page.locator("#receipt-title").locator("xpath=ancestor::section[1]").locator("dl"),
    another: page.getByText("ارزیابی برای سگ دیگه").first(),
  },
  { maxHeight: 1850 },
);

/*------ The second dog's request (not shown) ------*/
await fillRequest({
  dogId: fandoghId,
  days: ["پنجشنبه"],
  period: "صبح",
  photo: "app/db/seed-images/dog-pesteh.jpg",
});
await send();

/*------ 3. Waiting on «سگ‌های من» ------*/
await go(page, "/account");
await loadImages(page);
await shoot(
  page,
  "03-waiting",
  {
    badge: page.getByText("در انتظار ارزیابی").first(),
    withdraw: page.getByRole("button", { name: "پس گرفتن درخواست" }).first(),
    timeline: page.getByText("منتظر زنگ طلا").nth(1),
  },
  { maxHeight: 1660 },
);
await context.close();

/*===== The Admin answers =====*/
const { context: admin, page: panel } = await signIn({ phone: ADMIN_PHONE });
const ownerRow = (name) => panel.getByRole("link", { name, exact: true }).locator("xpath=ancestor::li[1]");

/*------ 4. The waiting requests ------*/
await go(panel, "/admin/evaluations");
await shoot(
  panel,
  "04-admin-list",
  {
    tabs: panel.getByRole("button", { name: /^در انتظار/ }),
    tara: ownerRow(EVALUATED),
    fandogh: ownerRow(REJECTED),
  },
  { maxHeight: 1300 },
);

/*------ 5. A request in its drawer ------*/
await panel.getByRole("link", { name: EVALUATED, exact: true }).first().click();
const drawer = panel.getByRole("dialog");
await drawer.waitFor();
await panel.waitForTimeout(1500);
await shoot(
  panel,
  "05-drawer",
  {
    owner: drawer.getByText(`${OWNER.first} ${OWNER.last}`),
    call: drawer.getByRole("link", { name: /۰۹۳۵/ }).first(),
    when: drawer.getByText("کی آزاده؟"),
    photos: drawer.getByRole("button", { name: /باز کردن عکس/ }).first(),
    evaluate: drawer.getByRole("button", { name: "ارزیابی شد" }),
    reject: drawer.getByRole("button", { name: "رد", exact: true }),
  },
  { maxHeight: 844 },
);

/*------ 6. «ارزیابی شد», asked once ------*/
await drawer.getByRole("button", { name: "ارزیابی شد" }).click();
const confirm = panel.getByRole("alertdialog");
await confirm.waitFor();
await panel.waitForTimeout(800);
await shoot(
  panel,
  "06-evaluate",
  {
    question: confirm.locator("h2").first(),
    yes: confirm.getByRole("button", { name: "ارزیابی شد" }),
    no: confirm.getByRole("button", { name: "نه، هنوز" }),
  },
  { maxHeight: 844 },
);
await confirm.getByRole("button", { name: "ارزیابی شد" }).click();
await confirm.waitFor({ state: "detached" });
await panel.waitForTimeout(1500);

/*------ 7. «رد» with a reason ------*/
await go(panel, "/admin/evaluations");
await panel.getByRole("link", { name: REJECTED, exact: true }).first().click();
await panel.getByRole("dialog").getByRole("button", { name: "رد", exact: true }).click();
await panel.locator("#reject-reason").waitFor();
await panel.locator("#reject-reason").fill(REASON);
await panel.waitForTimeout(800);
await shoot(
  panel,
  "07-reject",
  {
    question: panel
      .getByRole("dialog")
      .filter({ has: panel.locator("#reject-reason") })
      .locator("h2")
      .first(),
    reason: panel.locator("#reject-reason"),
    yes: panel.getByRole("button", { name: "رد کن" }),
  },
  { maxHeight: 844 },
);
await panel.getByRole("button", { name: "رد کن" }).click();
await panel.locator("#reject-reason").waitFor({ state: "detached" });
await admin.close();

/*===== 8. What the customer sees after each answer =====*/
{
  const { context: again, page: owner } = await signIn({ phone: OWNER_PHONE });
  await go(owner, "/account");
  await loadImages(owner);
  // From her dogs' heading down to the evaluated dog's courses button: both cards, without the page's head.
  const top = (await owner.locator("#account-home-title").boundingBox()).y + (await owner.evaluate(() => scrollY)) - 20;
  const until = owner.getByRole("link", { name: "دوره‌ها رو ببین" }).first();
  const end = (await until.boundingBox()).y + (await owner.evaluate(() => scrollY)) + 80;
  await shoot(
    owner,
    "08-answers",
    {
      rejected: owner.getByText("رد شد", { exact: true }).first(),
      reason: owner.getByText(/دلیل:/).first(),
      again: owner.getByRole("link", { name: "ارزیابی دوباره" }).first(),
      evaluated: owner.getByText("ارزیابی شد", { exact: true }).first(),
      courses: until,
    },
    { top, maxHeight: end - top },
  );
  await again.close();
}

await finish({ ownerPhone: OWNER_PHONE });
