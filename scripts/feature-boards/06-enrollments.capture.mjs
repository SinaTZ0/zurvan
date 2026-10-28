// Captures the end of a training (F6): the Admin's Enrollments page, «تمام شد» on one enrollment and «لغو» on another,
// then the customer's side: the course passed, and the next course in its line open to buy.
// Usage: node scripts/feature-boards/06-enrollments.capture.mjs [base-url]
import { ADMIN_PHONE, createCapture } from "./capture-lib.mjs";
import { freshPhone } from "./board-lib.mjs";
import { addDog, adminMarkEvaluated, loadImages } from "./journey-lib.mjs";

const { go, shoot, signIn, finish } = await createCapture({ board: "06-enrollments" });

const OWNER_PHONE = freshPhone();
const OWNER = { first: "حمید", last: "نوری" };
const DOG = "شاهین";
const COURSES = ["companion-1", "house-manner"];

/*===== The customer buys two courses for his evaluated dog (not shown) =====*/
const { context, page } = await signIn({ phone: OWNER_PHONE, name: OWNER });
const dogId = await addDog({
  page,
  go,
  name: DOG,
  breed: "ژرمن شپرد",
  ageYears: 1,
  ageMonths: 2,
  weight: "33",
  photo: "app/db/seed-images/dog-leo.jpg",
});
await adminMarkEvaluated({ signIn, go, dogId });
for (const slug of COURSES) {
  await go(page, `/courses/${slug}`);
  await page.locator(`input[name=course-dog][value="${dogId}"]`).locator("xpath=..").click();
  await page.getByRole("button", { name: "افزودن به سبد" }).first().click();
  await page.getByText("در سبد است").first().waitFor();
}
await go(page, "/account/cart");
for (const slug of COURSES) {
  await page.locator(`input[name=cart-place-${dogId}-${slug}][value=home]`).locator("xpath=..").click();
}
await page.waitForTimeout(1000);
await page.getByRole("button", { name: "پرداخت", exact: true }).first().click();
await page
  .getByText(/پرداخت انجام شد/)
  .first()
  .waitFor({ timeout: 30000 });
await context.close();

/*===== The Admin ends the two enrollments =====*/
const { context: admin, page: panel } = await signIn({ phone: ADMIN_PHONE });
const panelY = () => panel.evaluate(() => window.scrollY);
const block = panel
  .locator("article")
  .filter({ has: panel.getByRole("heading", { name: `${OWNER.first} ${OWNER.last}` }) });
const line = (latin) => block.locator("li").filter({ hasText: latin });
/** The page-space bottom of the customer's block, plus a margin. */
const blockBottom = async () => {
  const b = await block.boundingBox();
  return b.y + (await panelY()) + b.height + 24;
};

/*------ 1. Two enrollments in training ------*/
await go(panel, "/admin/enrollments");
await block.waitFor();
await shoot(
  panel,
  "01-admin-active",
  {
    tabs: panel.getByRole("button", { name: /^در حال آموزش/ }),
    call: block.getByRole("link", { name: /زنگ بزن/ }).first(),
    companion: line("Companion dog 1"),
    house: line("House manner"),
  },
  { maxHeight: await blockBottom() },
);

/*------ 2. «تمام شد», asked once ------*/
await line("Companion dog 1").getByRole("button", { name: "تمام شد" }).click();
const confirm = panel.getByRole("alertdialog");
await confirm.waitFor();
await panel.waitForTimeout(800);
await shoot(
  panel,
  "02-finish",
  {
    question: confirm.locator("h2").first(),
    yes: confirm.getByRole("button", { name: "تمام شد" }),
    no: confirm.getByRole("button", { name: "نه، هنوز" }),
  },
  { maxHeight: 844 },
);
await confirm.getByRole("button", { name: "تمام شد" }).click();
await confirm.waitFor({ state: "detached" });
await panel.waitForTimeout(2500);

/*------ 3. «لغو», asked once ------*/
await line("House manner").getByRole("button", { name: "لغو" }).click();
await confirm.waitFor();
await panel.waitForTimeout(800);
await shoot(
  panel,
  "03-cancel",
  {
    question: confirm.locator("h2").first(),
    body: confirm.getByText(/پولی خودکار برنمی‌گرده/),
    yes: confirm.getByRole("button", { name: "لغو کن" }),
  },
  { maxHeight: 844 },
);
await confirm.getByRole("button", { name: "لغو کن" }).click();
await confirm.waitFor({ state: "detached" });
await panel.waitForTimeout(2500);

/*------ 4. Both ended, under «همه» ------*/
await panel.getByRole("button", { name: /^همه/ }).first().click();
await block.waitFor();
await panel.waitForTimeout(1500);
{
  const b = await block.boundingBox();
  const top = b.y + (await panelY()) - 24;
  await shoot(
    panel,
    "04-admin-ended",
    {
      companion: line("Companion dog 1"),
      house: line("House manner"),
    },
    { top, maxHeight: b.height + 48 },
  );
}
await admin.close();

/*===== The customer's side =====*/
const { context: again, page: owner } = await signIn({ phone: OWNER_PHONE });
const ownerY = () => owner.evaluate(() => window.scrollY);

/*------ 5. «سگ‌های من» ------*/
await go(owner, "/account");
await loadImages(owner);
{
  const flag = owner.getByText("گذرونده", { exact: true }).last();
  const f = await flag.boundingBox();
  const bottom = f.y + (await ownerY()) + 140;
  await shoot(
    owner,
    "05-account",
    {
      stats: owner.getByText("دوره‌ی گذرونده").first().locator("xpath=.."),
      passed: flag.locator("xpath=ancestor::li[1]"),
    },
    { maxHeight: bottom },
  );
}

/*------ 6. The dog's page ------*/
await go(owner, `/account/dogs/${dogId}`);
await loadImages(owner);
{
  const logbook = owner.getByText(/لاگ‌بوک/).first();
  const bottom = (await logbook.boundingBox()).y + (await ownerY()) - 60;
  await shoot(
    owner,
    "06-dog",
    {
      stats: owner.getByText("دوره‌ی گذرونده").first().locator("xpath=.."),
      completed: owner.getByText("سگ همدم ۱", { exact: true }).first().locator("xpath=ancestor::li[1]"),
      cancelled: owner.getByText("سگ خونگی", { exact: true }).first().locator("xpath=ancestor::li[1]"),
    },
    { maxHeight: bottom },
  );
}

/*------ 7. The next course opens ------*/
await go(owner, `/buy?dog=${dogId}`);
await loadImages(owner);
{
  const card = (title) =>
    owner
      .getByRole("heading", { name: title, exact: true })
      .first()
      .locator("xpath=ancestor::*[contains(@class,'group/card')][1]");
  const later = owner.getByRole("heading", { name: "بعداً باز می‌شن" });
  const bottom = (await later.boundingBox()).y + (await ownerY()) - 120;
  await shoot(
    owner,
    "07-buy-next",
    {
      count: owner.getByText(/تا دوره می‌تونم بردارم/).first(),
      house: card("سگ خونگی"),
      companion2: card("سگ همدم ۲"),
    },
    { maxHeight: bottom },
  );
}
await again.close();

await finish({ ownerPhone: OWNER_PHONE, dogId });
