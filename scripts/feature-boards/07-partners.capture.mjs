// Captures the partners feature (F7): the Admin opens a partner's account, the partner's dashboard and Leads, a phone
// lead, a customer who signs up through the partner's link and pays, the commission it writes, the Admin marking it
// paid and the partner seeing it paid. Usage: node scripts/feature-boards/07-partners.capture.mjs [base-url]
import { ADMIN_PHONE, DEMO_CODE, createCapture } from "./capture-lib.mjs";
import { freshPhone } from "./board-lib.mjs";
import { addDog, adminMarkEvaluated } from "./journey-lib.mjs";
import { addToCart, payCart } from "./purchase-lib.mjs";

const { go, shoot, signIn, signInWithCode, newPage, finish } = await createCapture({ board: "07-partners" });

const PARTNER_PHONE = freshPhone();
const PARTNER = { first: "رضا", last: "نادری" };
// A new code every run: a code is never reused, and the board's partner is its own.
const CODE = `naderi-${Math.floor(Math.random() * 9000) + 1000}`;
const LEAD_PHONE = freshPhone();
const CUSTOMER_PHONE = freshPhone();
const CUSTOMER = { first: "مهسا", last: "رحیمی" };
const DOG = "بارون";
const PARTNER_NAME = `${PARTNER.first} ${PARTNER.last}`;
const CUSTOMER_NAME = `${CUSTOMER.first} ${CUSTOMER.last}`;

/** A person's row on Leads and Customers (the outer item, around its little road of stops). */
const leadRow = (page, text) =>
  page
    .locator("li")
    .filter({ hasText: text })
    .filter({ has: page.locator("li") })
    .last();

/** The commission's row in the partner's commissions list. */
const commissionRow = (page) =>
  page.locator("section[aria-labelledby=partner-commission-title] li").filter({ hasText: CUSTOMER_NAME }).first();

/*===== 1. The Admin opens the partner's account =====*/
const { context: adminContext, page: admin } = await signIn({ phone: ADMIN_PHONE });
await go(admin, "/admin/partners");
await admin.getByRole("button", { name: "همکار تازه" }).click();
await admin.locator("#new-partner-first-name").waitFor();
await admin.locator("#new-partner-first-name").fill(PARTNER.first);
await admin.locator("#new-partner-last-name").fill(PARTNER.last);
await admin.locator("#new-partner-phone").fill(PARTNER_PHONE);
await admin.locator("#new-partner-code").fill(CODE);
await shoot(
  admin,
  "01-create",
  {
    name: admin.locator("#new-partner-first-name"),
    phone: admin.locator("#new-partner-phone"),
    code: admin.locator("#new-partner-code"),
    link: admin.getByText("/?ref=").first(),
    submit: admin.getByRole("button", { name: "ساختن حساب" }),
  },
  { maxHeight: 844 },
);
await admin.getByRole("button", { name: "ساختن حساب" }).click();
await admin.locator("#new-partner-first-name").waitFor({ state: "detached" });
await admin.waitForLoadState("networkidle");

/*===== 2. The partner's dashboard: link and QR =====*/
const { context: partnerContext, page: partner } = await signIn({ phone: PARTNER_PHONE, name: PARTNER });
await go(partner, "/account/partner");
await partner.locator("#partner-shop-title").waitFor();
await shoot(
  partner,
  "02-dashboard",
  {
    hello: partner.locator("#partner-title"),
    counts: partner.locator("section[aria-labelledby=partner-title] dl"),
    qr: partner.locator("#partner-shop-title"),
    link: partner.getByRole("button", { name: "کپی لینک" }),
    download: partner.getByRole("button", { name: "دانلود QR" }),
  },
  { maxHeight: 1640 },
);

/*===== 3. A phone lead =====*/
await go(partner, "/account/partner/leads");
await partner.locator("#lead-phone").fill(LEAD_PHONE);
await partner.getByRole("button", { name: "ثبت شماره" }).click();
await partner.getByText("شماره ثبت شد").first().waitFor();
// The toast sits over the form: it's let go before the shot.
await partner
  .getByText("شماره ثبت شد")
  .first()
  .waitFor({ state: "detached", timeout: 15000 })
  .catch(() => {});
await partner.waitForLoadState("networkidle");
await shoot(
  partner,
  "03-lead",
  {
    form: partner.locator("#lead-phone"),
    submit: partner.getByRole("button", { name: "ثبت شماره" }),
    how: partner.getByRole("button", { name: "چطور حساب می‌شه؟" }),
    row: leadRow(partner, "منتظر ثبت‌نام"),
  },
  { maxHeight: 1460 },
);

/*===== The customer arrives through the link and signs up =====*/
const { context: customerContext, page: customer } = await newPage();
await go(customer, `/?ref=${CODE}`);
await go(customer, "/auth");
await signInWithCode(customer, CUSTOMER_PHONE);
await customer.keyboard.type(DEMO_CODE);
await customer.locator("#sign-in-first-name").fill(CUSTOMER.first);
await customer.locator("#sign-in-last-name").fill(CUSTOMER.last);
await customer.locator("#sign-in-last-name").press("Enter");
await customer.waitForURL((url) => !/\/auth/.test(url.pathname));
await customer.waitForLoadState("networkidle");

/*===== 4. The partner's Leads and Customers =====*/
await go(partner, "/account/partner/leads");
await partner.getByText(CUSTOMER_NAME).first().waitFor();
await shoot(
  partner,
  "04-customer",
  {
    counts: partner.locator("section[aria-labelledby=partner-leads-title] dl"),
    filters: partner.getByRole("button", { name: /^همه/ }),
    customer: leadRow(partner, CUSTOMER_NAME),
    lead: leadRow(partner, "منتظر ثبت‌نام"),
  },
  { maxHeight: 1640 },
);

/*===== 5. The customer pays =====*/
const dogId = await addDog({ page: customer, go, name: DOG, breed: "گلدن رتریور", ageYears: 1 });
await adminMarkEvaluated({ signIn, go, dogId });
await addToCart({ page: customer, go, slug: "house-manner", dogName: DOG });
await payCart({ page: customer, go });
await shoot(customer, "05-paid", { banner: customer.getByText(/پرداخت انجام شد/).first() }, { maxHeight: 900 });
await customerContext.close();

/*===== 6. The commission on the partner's dashboard =====*/
await go(partner, "/account/partner");
const commissionTop = await partner
  .locator("#partner-funnel-title")
  .evaluate((el) => el.getBoundingClientRect().top + scrollY - 110);
await shoot(
  partner,
  "06-commission",
  {
    funnel: partner.locator("#partner-funnel-title"),
    pending: partner.locator("section[aria-labelledby=partner-commission-title] dl > div").first(),
    steps: partner.locator("section[aria-labelledby=partner-commission-title] div.mt-5").first(),
    next: partner.getByText(/تا حالا/).first(),
    row: commissionRow(partner),
  },
  { top: Math.round(commissionTop), maxHeight: 1240 },
);

/*===== 7. The Admin marks it paid =====*/
await go(admin, "/admin/partners");
const slip = admin.locator("article, li").filter({ hasText: PARTNER_NAME }).first();
await slip.waitFor();
await slip.scrollIntoViewIfNeeded();
const slipTop = await slip.evaluate((el) => el.getBoundingClientRect().top + scrollY - 20);
await shoot(
  admin,
  "07-admin-pay",
  {
    partner: slip.getByText(PARTNER_NAME).first(),
    sheba: slip.getByText(/شبا/).first(),
    line: slip.getByText(CUSTOMER_NAME).first(),
    pay: slip.getByRole("button", { name: "پرداخت شد" }).first(),
  },
  { top: Math.round(slipTop), maxHeight: 1700 },
);
await slip.getByRole("button", { name: "پرداخت شد" }).first().click();
await admin.getByRole("alertdialog").getByRole("button", { name: "بله، پرداخت شد" }).click();
await admin.getByRole("alertdialog").waitFor({ state: "detached" });
await admin.waitForTimeout(1500);
await adminContext.close();

/*===== 8. The partner sees it paid =====*/
await go(partner, "/account/partner");
await shoot(
  partner,
  "08-paid",
  {
    paid: partner.locator("section[aria-labelledby=partner-commission-title] dl > div").last(),
    row: commissionRow(partner),
  },
  { top: Math.round(commissionTop), maxHeight: 1240 },
);
await partnerContext.close();

await finish({ partnerPhone: PARTNER_PHONE, code: CODE, leadPhone: LEAD_PHONE, customerPhone: CUSTOMER_PHONE });
