// Captures what one person can't see of another: a customer opening another customer's dog page or the Admin's panel,
// a partner's Leads and Customers (no prices, dogs or courses), and a lead another partner won (no name, no partner).
// Usage: node scripts/feature-boards/11-privacy.capture.mjs [base-url]
import { ADMIN_PHONE, createCapture } from "./capture-lib.mjs";
import { freshPhone } from "./board-lib.mjs";

const { go, box, shoot, signIn, finish } = await createCapture({ board: "11-privacy" });

const SARA_PHONE = "09120000004"; // سارا محمدی: Leo
const BAHRAM_PHONE = "09120000003"; // the demo partner who brought Sara
const OTHER_PHONE = freshPhone();
const OTHER = { first: "کامران", last: "شریفی" };
// Two partners of the board's own, who both write down the same number before its owner signs up.
const FIRST_PARTNER = { phone: freshPhone(), first: "آرش", last: "توکلی" };
const SECOND_PARTNER = { phone: freshPhone(), first: "نیما", last: "فرهادی" };
const LEAD = { phone: freshPhone(), first: "کیان", last: "رحیمی" };

/** The Persian digits of a phone number, as the leads list writes it. */
const toFa = (text) => text.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

/*===== 1. Sara's own dog =====*/
let leoPath;
{
  const { context, page } = await signIn({ phone: SARA_PHONE });
  await go(page, "/account");
  await page
    .getByRole("link", { name: /همه‌ی سابقه‌ی.*لئو/ })
    .first()
    .click();
  await page.waitForURL(/\/account\/dogs\//);
  await page.waitForLoadState("networkidle");
  leoPath = new URL(page.url()).pathname;
  await shoot(
    page,
    "01-own-dog",
    {
      name: page.locator("#dog-name"),
      account: page.getByRole("button", { name: /حساب سارا/ }),
      enrollments: page.locator("#enrollments-title"),
    },
    { maxHeight: 860 },
  );
  await context.close();
}

/*===== 2–3. Another customer =====*/
{
  const { context, page } = await signIn({ phone: OTHER_PHONE, name: OTHER });

  /*------ 2. The same address ------*/
  await go(page, leoPath);
  await page.locator("#dog-detail-error-title").waitFor();
  await shoot(
    page,
    "02-not-found",
    {
      account: page.getByRole("button", { name: /حساب کامران/ }),
      title: page.locator("#dog-detail-error-title"),
      back: page.getByRole("link", { name: "سگ‌های من" }).first(),
    },
    { maxHeight: 860 },
  );

  /*------ 3. The Admin's panel ------*/
  await go(page, "/admin");
  await page.waitForURL((url) => !url.pathname.startsWith("/admin"));
  await page.waitForLoadState("networkidle");
  await shoot(
    page,
    "03-no-admin",
    {
      title: page.locator("h1").first(),
      empty: page.locator("#no-dogs-title"),
    },
    { maxHeight: 860 },
  );
  await context.close();
}

/*===== 4. A partner's Leads and Customers =====*/
{
  const { context, page } = await signIn({ phone: BAHRAM_PHONE });
  await go(page, "/account/partner/leads");
  await page.locator("#leads-list-title").waitFor();
  const sara = page.locator("li").filter({ hasText: "سارا محمدی" }).last();
  const list = await box(page, page.locator("#leads-list-title"));
  const end = await box(page, sara);
  const top = Math.round(list.y - 150);
  await shoot(
    page,
    "04-partner-leads",
    {
      name: sara.locator("span.font-extrabold").first(),
      stage: sara.locator("span.rounded-full.px-3"),
      road: sara.locator("[aria-hidden] > div").nth(1),
      commission: sara.locator(".border-t.border-dashed"),
      others: page.locator("li").filter({ hasText: "منتظر ثبت‌نام" }).first().locator("span.font-extrabold"),
    },
    { top, maxHeight: Math.round(end.y + end.h + 200 - top) },
  );
  await context.close();
}

/*===== 5. A lead another partner won =====*/
/*------ The Admin opens two partners' accounts ------*/
{
  const { context, page } = await signIn({ phone: ADMIN_PHONE });
  for (const partner of [FIRST_PARTNER, SECOND_PARTNER]) {
    await go(page, "/admin/partners?new=1");
    await page.locator("#new-partner-first-name").waitFor();
    await page.locator("#new-partner-first-name").fill(partner.first);
    await page.locator("#new-partner-last-name").fill(partner.last);
    await page.locator("#new-partner-phone").fill(partner.phone);
    await page.getByRole("button", { name: "ساختن حساب" }).click();
    await page.locator("#new-partner-first-name").waitFor({ state: "detached" });
  }
  await context.close();
}

/*------ Both write down the same number, the first one first ------*/
async function writeLead(partner) {
  const { context, page } = await signIn({ phone: partner.phone, name: partner });
  await go(page, "/account/partner/leads");
  await page.locator("#lead-phone").fill(LEAD.phone);
  await page.getByRole("button", { name: "ثبت شماره" }).click();
  await page
    .getByText(toFa(LEAD.phone.slice(-4)))
    .first()
    .waitFor();
  await context.close();
}
await writeLead(FIRST_PARTNER);
await writeLead(SECOND_PARTNER);

/*------ The person signs up: the earlier lead wins ------*/
{
  const { context } = await signIn({ phone: LEAD.phone, name: LEAD });
  await context.close();
}

/*------ The second partner's list ------*/
{
  const { context, page } = await signIn({ phone: SECOND_PARTNER.phone });
  await go(page, "/account/partner/leads");
  await page.locator("#leads-list-title").waitFor();
  const row = page
    .locator("li")
    .filter({ hasText: toFa(LEAD.phone.slice(-4)) })
    .last();
  const list = await box(page, page.locator("#leads-list-title"));
  const end = await box(page, row);
  const top = Math.round(list.y - 150);
  await shoot(
    page,
    "05-lost",
    {
      phone: row.locator("span.font-extrabold").first(),
      stage: row.locator("span.rounded-full.px-3"),
      road: row.locator("[aria-hidden] > div").nth(1),
    },
    { top, maxHeight: Math.round(end.y + end.h + 60 - top) },
  );
  await context.close();
}

await finish({ otherPhone: OTHER_PHONE, firstPartner: FIRST_PARTNER, secondPartner: SECOND_PARTNER, lead: LEAD });
