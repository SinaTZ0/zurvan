// Captures what the site shows while the site rules have no approved wording: the rules address answering 404 with no
// link to it, sign-up's name step and the cart without a tick, and the Privacy page that is published.
// Usage: node scripts/feature-boards/12-consent-rules.capture.mjs [base-url]
import { ADMIN_PHONE, DEMO_CODE, createCapture } from "./capture-lib.mjs";
import { freshPhone } from "./board-lib.mjs";
import { addDog, adminMarkEvaluated } from "./journey-lib.mjs";

const { go, newPage, box, shoot, signIn, signInWithCode, finish } = await createCapture({ board: "12-consent-rules" });

const NEW_PHONE = freshPhone();
const NEW = { first: "پریسا", last: "کاظمی" };
const DOG = "هاپو";
const COURSE = "سگ خونگی";

/*===== 1. The rules address: a 404 =====*/
const stranger = await newPage();
await go(stranger.page, "/rules");
await stranger.page.locator("#not-found-title").waitFor();
await shoot(
  stranger.page,
  "01-rules-404",
  {
    title: stranger.page.locator("#not-found-title"),
    header: stranger.page.locator("header").first(),
    home: stranger.page.getByRole("link", { name: "برو صفحه‌ی اول" }),
  },
  { maxHeight: 860 },
);

/*===== 2. The footer: no link to the rules =====*/
{
  const footer = await box(stranger.page, stranger.page.locator("footer").last());
  const privacy = await box(stranger.page, stranger.page.locator("footer").getByRole("link", { name: "حریم خصوصی" }));
  const top = Math.round(footer.y);
  await shoot(
    stranger.page,
    "02-footer",
    {
      guide: stranger.page.locator("footer").getByRole("heading", { name: "راهنما" }).locator(".."),
      privacy: stranger.page.locator("footer").getByRole("link", { name: "حریم خصوصی" }),
    },
    { top, maxHeight: Math.round(privacy.y + privacy.h + 40 - top) },
  );
}

/*===== 5. The Privacy page (shot now, numbered last) =====*/
await stranger.page.locator("footer").getByRole("link", { name: "حریم خصوصی" }).click();
await stranger.page.waitForURL(/\/privacy/);
await stranger.page.locator("#privacy-title").waitFor();
await stranger.page.waitForLoadState("networkidle");
await shoot(
  stranger.page,
  "05-privacy",
  {
    title: stranger.page.locator("#privacy-title"),
    kept: stranger.page.locator("#kept-title"),
  },
  { maxHeight: 1000 },
);
await stranger.context.close();

/*===== 3. Sign-up's name step: no tick =====*/
const { context, page } = await newPage();
await go(page, "/auth");
await page.locator("#sign-in-phone").waitFor();
await signInWithCode(page, NEW_PHONE);
await page.keyboard.type(DEMO_CODE);
await page.locator("#sign-in-first-name").waitFor();
await page.locator("#sign-in-first-name").fill(NEW.first);
await page.locator("#sign-in-last-name").fill(NEW.last);
await shoot(
  page,
  "03-name",
  {
    created: page.getByText("حسابت ساخته شد"),
    first: page.locator("#sign-in-first-name"),
    last: page.locator("#sign-in-last-name"),
    next: page.getByRole("button", { name: "ادامه" }),
  },
  { maxHeight: 960 },
);
await page.getByRole("button", { name: "ادامه" }).click();
await page.waitForURL(/\/account/);
await page.waitForLoadState("networkidle");

/*===== 4. The cart: no tick before «پرداخت» =====*/
// The same new customer, still signed in (a second code to the number would wait for the resend timer); the Admin
// marks the dog evaluated.
const owner = { context, page };
const dogId = await addDog({ page: owner.page, go, name: DOG, breed: "پودل", ageYears: 1, weight: "8" });
await adminMarkEvaluated({ signIn, go, dogId });
await go(owner.page, `/buy?dog=${dogId}`);
await owner.page
  .getByRole("heading", { name: COURSE, exact: true })
  .locator("xpath=following::button[contains(., 'افزودن به سبد')][1]")
  .click();
await owner.page.waitForTimeout(1500);
await go(owner.page, "/account/cart");
await owner.page.getByText("منزل", { exact: true }).first().click();
{
  const more = await box(owner.page, owner.page.getByRole("link", { name: "افزودن دوره‌ی دیگر" }));
  const end = Math.round(more.y + more.h + 30);
  await shoot(
    owner.page,
    "04-cart",
    {
      item: owner.page.getByRole("heading", { name: COURSE, exact: true }),
      summary: owner.page.locator("#cart-summary-title"),
      pay: owner.page.getByRole("button", { name: "پرداخت" }),
      more: owner.page.getByRole("link", { name: "افزودن دوره‌ی دیگر" }),
    },
    { maxHeight: end },
  );
}
await owner.context.close();

await finish({ newPhone: NEW_PHONE, dogId, adminPhone: ADMIN_PHONE });
