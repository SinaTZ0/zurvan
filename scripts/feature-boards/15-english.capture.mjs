// Captures a short tour of the English site (F15): the home page, the course catalogue, a course page with its Toman
// price, signing in in English, the account in English, and the Admin, whose English address leads back to Persian.
// Usage: node scripts/feature-boards/15-english.capture.mjs [base-url]
import { ADMIN_PHONE, DEMO_CODE, createCapture } from "./capture-lib.mjs";
import { freshPhone } from "./board-lib.mjs";

const { go, box, shoot, newPage, signIn, finish } = await createCapture({ board: "15-english" });

/*===== Test Data =====*/
// Someone who reads the English site types a Latin name.
const PHONE = freshPhone();
const NAME = { first: "Nima", last: "Farahani" };
const COURSE = "/en/courses/house-manner";

/*===== A visitor in English =====*/
const { context, page } = await newPage({ locale: "en-US" });

/*------ 1. The home page ------*/
await go(page, "/en");
await shoot(
  page,
  "01-home",
  {
    brand: page.getByRole("link", { name: "Zurvann, home page" }),
    hero: page.locator("#st-hero-title"),
    evaluation: page.getByRole("link", { name: "Request a free evaluation" }).first(),
    path: page.locator("#st-path-title"),
  },
  { maxHeight: 1150 },
);

/*------ 2. The course catalogue ------*/
await go(page, "/en/courses");
await page.waitForTimeout(800);
await shoot(
  page,
  "02-catalogue",
  {
    title: page.locator("#catalogue-title"),
    families: page.getByRole("button", { name: "All", exact: true }).locator(".."),
    sessions: page.getByText("About 5 sessions").first(),
    price: page.getByText(/million Toman/).first(),
  },
  { maxHeight: 1250 },
);

/*------ 3. A course page ------*/
await go(page, COURSE);
await page.waitForTimeout(800);
const addToCart = page.getByRole("link", { name: "Sign in and add to cart" });
await shoot(
  page,
  "03-course",
  {
    title: page.locator("#course-title"),
    facts: page.getByText("Number of sessions").locator("xpath=ancestor::dl[1] | ancestor::ul[1]").first(),
    sessions: page.getByText("About 5 sessions").first(),
    price: page.getByText(/4,500,000/).first(),
    add: addToCart,
  },
  { maxHeight: 1650 },
);

/*------ 4. Signing in in English ------*/
await addToCart.click();
await page.locator("#sign-in-phone").waitFor();
await page.waitForLoadState("networkidle");
await page.locator("#sign-in-phone").fill(PHONE);
await page.getByRole("button", { name: "Send the sign-in code" }).click();
await page.locator('input[autocomplete="one-time-code"], [data-input-otp]').first().waitFor();
await page.waitForTimeout(600);
await shoot(
  page,
  "04-sign-in",
  {
    title: page.getByText("Tell me the code from the text").first(),
    sent: page.getByText(/We texted a/).first(),
    code: page.locator('input[autocomplete="one-time-code"], [data-input-otp]').first(),
  },
  { maxHeight: 1000 },
);

/*------ 5. The account in English ------*/
await page.keyboard.type(DEMO_CODE);
await page.locator("#sign-in-first-name").waitFor();
await page.locator("#sign-in-first-name").fill(NAME.first);
await page.locator("#sign-in-last-name").fill(NAME.last);
await page.locator("#sign-in-last-name").press("Enter");
await page.waitForURL((url) => !/\/auth/.test(url.pathname));
await page.waitForLoadState("networkidle");
const landedOn = new URL(page.url()).pathname;

/*------ 5. Back on the course, still in English ------*/
await page
  .getByText(/4,500,000/)
  .first()
  .waitFor();
await page.waitForTimeout(800);
const priceY = (await box(page, page.getByText(/4,500,000/).first())).y;
await shoot(
  page,
  "05-back",
  {
    title: page.locator("#course-title"),
    price: page.getByText(/4,500,000/).first(),
    cart: page.getByRole("link", { name: /cart/i }).first(),
    addDog: page.getByRole("link", { name: "Add your dog" }).first(),
  },
  { maxHeight: priceY + 310 },
);

/*------ 6. The account in English ------*/
await go(page, "/en/account");
await page.waitForTimeout(800);
await shoot(
  page,
  "06-account",
  {
    hello: page.getByText("Hi Nima!").last(),
    greeting: page.locator("h1").first(),
    empty: page.getByText("Introduce your first dog"),
    add: page.getByRole("link", { name: "Add a dog" }).first(),
  },
  { maxHeight: 1100 },
);
await context.close();

/*===== The Admin stays Persian =====*/
{
  const { context: admin, page: panel } = await signIn({ phone: ADMIN_PHONE, locale: "en-US" });
  await go(panel, "/en/admin");
  await panel.waitForTimeout(800);
  await shoot(
    panel,
    "07-admin",
    {
      heading: panel.locator("h1").first(),
      header: panel.getByRole("link", { name: /نمای کلی مدیریت/ }),
      waiting: panel.getByRole("heading", { name: "منتظر توست" }),
      tabs: panel.getByRole("link", { name: "نمای کلی" }).last(),
    },
    { maxHeight: 844 },
  );
  await admin.close();
}

await finish({ phone: PHONE, landedOn });
