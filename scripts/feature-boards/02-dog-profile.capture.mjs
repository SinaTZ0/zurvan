// Captures introducing a dog (the four-step form), its page, the locked fields of an evaluated dog and the Admin's
// view of the new dog. Usage: node scripts/feature-boards/02-dog-profile.capture.mjs [base-url]
import { ADMIN_PHONE, createCapture } from "./capture-lib.mjs";
import { freshPhone } from "./board-lib.mjs";

const { go, shoot, signIn, finish } = await createCapture({ board: "02-dog-profile" });

const OWNER_PHONE = freshPhone();
const OWNER = { first: "نگار", last: "احمدی" };
const DOG = "شیرو";
const RETURNING_PHONE = "09120000004"; // سارا محمدی: Leo is evaluated

/** The step's card, from the stepper down to its buttons. */
const stepper = (page) => page.getByRole("button", { name: /شناسنامه/ });

/*===== A new customer introduces a dog =====*/
const { context, page } = await signIn({ phone: OWNER_PHONE, name: OWNER });

/*------ 1. No dogs yet ------*/
await go(page, "/account");
await shoot(
  page,
  "01-no-dogs",
  { empty: page.locator("#no-dogs-title"), add: page.getByRole("link", { name: "معرفی سگ" }).first() },
  { maxHeight: 1100 },
);

/*------ 2. Who it is ------*/
await page.getByRole("link", { name: "معرفی سگ" }).first().click();
await page.locator("#dog-name").waitFor();
await page.waitForLoadState("networkidle");
await page.locator("input[type=file]").first().setInputFiles("app/db/seed-images/dog-leo.jpg");
await page.locator("#dog-name").fill(DOG);
await page.getByText("نر", { exact: true }).click();
await page.getByText("حدودی می‌دونم").click();
await page.locator("select[name=ageYears]").selectOption({ index: 2 });
await page.locator("select[name=ageMonths]").selectOption({ index: 4 });
await page.getByText("دورگه", { exact: true }).click();
await page.locator("#dog-breed").fill("مالینویز");
await page.locator("#dog-breed-secondary").fill("ژرمن شپرد");
await page.locator("#dog-name").click(); // closes the breed suggestions
await page.getByRole("button", { name: "حذف عکس" }).waitFor();
await page.waitForTimeout(1500);
await shoot(
  page,
  "02-identity",
  {
    remove: page.getByRole("button", { name: "حذف عکس" }),
    steps: stepper(page).locator(".."),
    sex: page.locator("input[name=sex]").first().locator("xpath=ancestor::fieldset[1]"),
    age: page.locator("select[name=ageYears]"),
    purity: page.locator("input[name=breedPurity]").first().locator("xpath=ancestor::fieldset[1]"),
    breeds: page.locator("#dog-breed-secondary"),
    breed: page.locator("#dog-breed"),
    next: page.getByRole("button", { name: "بعدی" }),
  },
  { maxHeight: 1700 },
);

/*------ 3. Body ------*/
await page.getByRole("button", { name: "بعدی" }).click();
await page.locator("#dog-weight").waitFor();
await page.locator("#dog-weight").fill("28");
await page.locator("#dog-height").fill("60");
await page.locator("label", { hasText: /^نه$/ }).click();
await page.locator("#dog-coat").fill("قهوه‌ای و مشکی");
await shoot(
  page,
  "03-body",
  {
    weight: page.locator("#dog-weight"),
    neutered: page.locator("input[name=isNeutered]").first().locator("xpath=ancestor::fieldset[1]"),
    optional: page.locator("#dog-coat"),
    next: page.getByRole("button", { name: "بعدی" }),
  },
  { maxHeight: 1450 },
);

/*------ 4. Health (optional) ------*/
await page.getByRole("button", { name: "بعدی" }).click();
await page.locator("#dog-microchip").waitFor();
await page.locator("label", { hasText: /^کامل$/ }).click();
await page.locator("#dog-vaccination-notes").fill("هاری و چندگانه امسال زده شده");
await shoot(
  page,
  "04-health",
  {
    vaccines: page.locator("input[name=vaccinationStatus]").first().locator("xpath=ancestor::fieldset[1]"),
    card: page.getByText("افزودن عکس").first(),
    microchip: page.locator("#dog-microchip"),
    medical: page.locator("#dog-medical"),
    later: page.getByRole("button", { name: "بعداً" }),
  },
  { maxHeight: 2200 },
);

/*------ 5. Training (optional) ------*/
await page.getByRole("button", { name: "بعدی" }).click();
await page.locator("#dog-problems").waitFor();
await page.locator("label", { hasText: /^خانگی$/ }).click();
await page.locator("label", { hasText: /^ورزشی$/ }).click();
await page.locator("#dog-problems").fill("روی مهمون می‌پره\nقلاده رو می‌کشه");
await page.locator("#dog-behavior").fill("صبح‌ها انرژیش خیلی زیاده");
await shoot(
  page,
  "05-training",
  {
    goals: page.locator("input[name=trainingGoals]").first().locator("xpath=ancestor::fieldset[1]"),
    problems: page.locator("#dog-problems"),
    submit: page.getByRole("button", { name: "اضافه کن" }),
  },
  { maxHeight: 1350 },
);

/*------ 6. Back on «سگ‌های من» ------*/
await page.getByRole("button", { name: "اضافه کن" }).click();
await page.waitForURL((url) => url.pathname === "/account");
await page.waitForLoadState("networkidle");
await page.getByText(`${DOG} اضافه شد`).waitFor();
await shoot(
  page,
  "06-dogs",
  {
    toast: page.getByText(`${DOG} اضافه شد`),
    badge: page.getByText("ارزیابی نشده").first(),
    line: page.getByText(/حدوداً ۱ ساله/).first(),
    evaluation: page.getByRole("link", { name: "ارزیابی رایگان" }).first(),
    record: page.getByText(/همه‌ی سابقه‌ی/).first(),
  },
  { maxHeight: 1400 },
);
await page
  .getByText(/همه‌ی سابقه‌ی/)
  .first()
  .click();
await page.waitForURL(/\/account\/dogs\/[0-9a-f-]{20,}/);
const dogUrl = page.url();
await context.close();

/*===== An evaluated dog: the locked fields =====*/
{
  const { context: returning, page: sara } = await signIn({ phone: RETURNING_PHONE });
  await go(sara, "/account");
  await sara.getByRole("link", { name: /لئو/ }).first().click();
  await sara.waitForURL(/\/account\/dogs\//);
  await go(sara, `${new URL(sara.url()).pathname}/edit`);
  await sara.locator("#dog-name").waitFor();
  await shoot(
    sara,
    "07-locked",
    {
      locks: sara.locator("input[name=breedPurity], #dog-breed").first(),
      locked: sara.getByText(/فقط طلا می‌تونه/).first(),
      name: sara.locator("#dog-name"),
    },
    { maxHeight: 1450 },
  );
  await returning.close();
}

/*===== The Admin's view of the new dog =====*/
{
  const { context: admin, page: panel } = await signIn({ phone: ADMIN_PHONE });
  await go(panel, `/admin/dogs/${dogUrl.split("/").pop()}`);
  await panel.waitForTimeout(1000);
  await shoot(
    panel,
    "08-admin-dog",
    {
      heading: panel.locator("h1").first(),
      edit: panel.getByText("ویرایش مشخصات").first(),
      owner: panel.getByText(`${OWNER.first} ${OWNER.last}`).first(),
      evaluate: panel.getByRole("button", { name: "ارزیابی شد" }).first(),
      courses: panel.getByRole("heading", { name: "دوره‌ها" }).first(),
      problems: panel.getByRole("heading", { name: "مشکلات رفتاری" }).first(),
    },
    { maxHeight: 2650 },
  );
  await admin.close();
}

await finish({ ownerPhone: OWNER_PHONE, dogUrl });
