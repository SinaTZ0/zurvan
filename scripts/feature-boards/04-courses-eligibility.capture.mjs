// Captures the course catalogue (F8) and who can take what (F4): the catalogue, a course's settings, the verdict for each
// of a customer's dogs on a course page (not evaluated, prerequisite not passed, too old) and the «خرید دوره» page that
// starts from the dog.
// Usage: node scripts/feature-boards/04-courses-eligibility.capture.mjs [base-url]
import { createCapture } from "./capture-lib.mjs";
import { freshPhone } from "./board-lib.mjs";
import { addDog, adminMarkEvaluated, loadImages } from "./journey-lib.mjs";

const { go, shoot, signIn, finish } = await createCapture({ board: "04-courses-eligibility" });

const OWNER_PHONE = freshPhone();
const OWNER = { first: "علی", last: "رضایی" };
const EVALUATED = "رستم"; // a year and two months old, evaluated, no course passed yet
const NEW_DOG = "نازی"; // not evaluated

/*===== The customer, his two dogs, one of them evaluated =====*/
const { context, page } = await signIn({ phone: OWNER_PHONE, name: OWNER });
const rostamId = await addDog({
  page,
  go,
  name: EVALUATED,
  breed: "ژرمن شپرد",
  ageYears: 1,
  ageMonths: 2,
  weight: "32",
  photo: "app/db/seed-images/dog-leo.jpg",
});
const naziId = await addDog({
  page,
  go,
  name: NEW_DOG,
  sex: "ماده",
  breed: "پامرانین",
  ageYears: 2,
  weight: "3",
  photo: "app/db/seed-images/dog-pesteh.jpg",
});
await adminMarkEvaluated({ signIn, go, dogId: rostamId });

/*------ Helpers ------*/
/** A fact cell of a course page's settings grid («تعداد جلسه‌ها», «سن سگ», …), from its label. */
const fact = (label) => page.getByText(label, { exact: true }).first().locator("xpath=..");
/** A dog's row in a course page's «برای کدوم سگ؟». */
const dogRow = (dogId) => page.locator(`input[name=course-dog][value="${dogId}"]`).locator("xpath=..");
const scrollY = () => page.evaluate(() => window.scrollY);
/** A locator's page-space top. */
const yOf = async (locator) => (await locator.first().boundingBox()).y + (await scrollY());

/**
 * Picks a dog on a course page and shoots the buy card, from above the price tag to «خرید چطوری کار می‌کنه؟».
 *
 * @param targets The boxes to record, besides the dog's row.
 */
async function shootBuyCard({ name, dogId, targets }) {
  await dogRow(dogId).click();
  await page.waitForTimeout(1500);
  const top = (await yOf(page.getByText("هزینه‌ی دوره").first())) - 50;
  const bottom = (await yOf(page.getByRole("link", { name: "خرید چطوری کار می‌کنه؟" }))) + 50;
  await shoot(page, name, { dog: dogRow(dogId), ...targets }, { top, maxHeight: bottom - top });
}

/*------ 1. The catalogue ------*/
await go(page, "/courses");
await loadImages(page);
await shoot(
  page,
  "01-catalogue",
  {
    buy: page.getByRole("link", { name: "خرید دوره" }).first(),
    chipsFrom: page.getByRole("button", { name: "همه", exact: true }),
    chipsTo: page.getByRole("button", { name: "فرمان‌پذیری", exact: true }),
    family: page.locator("#family-basics"),
    card: page.getByRole("heading", { name: "سگ خونگی" }).first().locator("xpath=ancestor::*[.//img][1]"),
  },
  { maxHeight: 940 },
);

/*------ 2. A course's settings ------*/
await go(page, "/courses/companion-2");
await loadImages(page);
await shoot(
  page,
  "02-course",
  {
    title: page.locator("#course-title"),
    sessions: fact("تعداد جلسه‌ها"),
    age: fact("سن سگ"),
    place: fact("محل آموزش"),
    prerequisite: fact("پیش‌نیاز"),
  },
  { maxHeight: 900 },
);

/*------ 3. A dog that isn't evaluated ------*/
await shootBuyCard({
  name: "03-not-evaluated",
  dogId: naziId,
  targets: {
    price: page.getByText("هزینه‌ی دوره").first().locator("xpath=.."),
    reason: page.getByText(/هنوز ارزیابی نشده/).first(),
    evaluation: page.getByRole("link", { name: "ارزیابی رایگان" }).last(),
    prerequisite: page.getByText(new RegExp(`${NEW_DOG} اول باید دوره‌ی`)).first(),
    add: page.getByRole("button", { name: "افزودن به سبد" }).first(),
  },
});

/*------ 4. A prerequisite not passed ------*/
await shootBuyCard({
  name: "04-prerequisite",
  dogId: rostamId,
  targets: {
    bubble: page.getByText("یه قدم مونده تا به این دوره برسم").first(),
    reason: page.getByText(new RegExp(`${EVALUATED} اول باید دوره‌ی`)).first(),
    link: page.getByRole("link", { name: "این دوره رو ببین" }).first(),
  },
});

/*------ 5. Too old ------*/
await go(page, "/courses/bmc");
await loadImages(page);
await dogRow(rostamId).click();
await page.waitForTimeout(1500);
{
  const bottom = (await yOf(page.getByRole("link", { name: "خرید چطوری کار می‌کنه؟" }))) + 50;
  await shoot(
    page,
    "05-age",
    {
      age: fact("سن سگ"),
      place: fact("محل آموزش"),
      dog: dogRow(rostamId),
      reason: page.getByText(/حداکثر سن این دوره/).first(),
    },
    { maxHeight: bottom },
  );
}

/*------ 6. «خرید دوره»: which dog? ------*/
await go(page, "/buy");
await loadImages(page);
await shoot(
  page,
  "06-buy-pick",
  {
    title: page.locator("#buy-title"),
    rostam: page.getByRole("link", { name: new RegExp(EVALUATED) }).first(),
    nazi: page.getByRole("link", { name: new RegExp(NEW_DOG) }).first(),
    another: page.getByRole("link", { name: /سگ دیگه/ }).first(),
  },
  { maxHeight: 900 },
);

/*------ 7. What the dog can take now ------*/
await page
  .getByRole("link", { name: new RegExp(EVALUATED) })
  .first()
  .click();
await page.waitForURL(/dog=/);
await page.waitForLoadState("networkidle");
await loadImages(page);
const laterTitle = page.getByRole("heading", { name: "بعداً باز می‌شن" });
const laterTop = (await yOf(laterTitle)) - 120;
const card = (title) =>
  page
    .getByRole("heading", { name: title, exact: true })
    .first()
    .locator("xpath=ancestor::*[contains(@class,'group/card')][1]");
await shoot(
  page,
  "07-buy-open",
  {
    dog: page.getByRole("link", { name: new RegExp(EVALUATED) }).first(),
    open: page.getByRole("heading", { name: "الان می‌تونه" }),
    first: card("سگ خونگی"),
    companion: card("سگ همدم ۱"),
  },
  { maxHeight: laterTop },
);

/*------ 8. What opens later, and why ------*/
const laterRow = (title) =>
  page.getByRole("heading", { name: title, exact: true }).first().locator("xpath=ancestor::li[1]");
const laterEnd = (await yOf(laterRow("سگ‌های ورزشی"))) + (await laterRow("سگ‌های ورزشی").boundingBox()).height + 40;
await shoot(
  page,
  "08-buy-later",
  {
    title: laterTitle,
    bmc: laterRow("مخصوص سگ‌های شش‌ماهه"),
    companion2: laterRow("سگ همدم ۲"),
    working: laterRow("سگ‌های کار"),
  },
  { top: laterTop, maxHeight: laterEnd - laterTop },
);
await context.close();

await finish({ ownerPhone: OWNER_PHONE, dogs: { rostamId, naziId } });
