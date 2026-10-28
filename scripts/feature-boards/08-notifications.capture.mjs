// Captures the notifications (F9): a customer's own events (an evaluation request, one dog evaluated and one rejected, a
// purchase, the course marked done) and the SMS each one wrote in the Admin's SMS Outbox, with the in-app copies on the
// customer's pages. Usage: node scripts/feature-boards/08-notifications.capture.mjs [base-url]
import { ADMIN_PHONE, createCapture } from "./capture-lib.mjs";
import { freshPhone } from "./board-lib.mjs";
import { addDog } from "./journey-lib.mjs";
import { addToCart, answerEvaluation, payCart, requestEvaluation } from "./purchase-lib.mjs";

const { go, shoot, signIn, finish } = await createCapture({ board: "08-notifications" });

const CUSTOMER_PHONE = freshPhone();
const CUSTOMER = { first: "نرگس", last: "صالحی" };
const CUSTOMER_NAME = `${CUSTOMER.first} ${CUSTOMER.last}`;
const DOG = "تارا"; // evaluated, buys a course and finishes it
const OTHER_DOG = "جکی"; // rejected
const REASON = "روز قرار کسی خونه نبود؛ یه روز دیگه درخواست بده";
const COURSE = "سگ خونگی";

/*===== Outbox Helpers =====*/
/** The outbox row (one SMS) whose text has `text`. */
const smsRow = (page, text) => page.locator("li").filter({ hasText: text }).first();

/**
 * Opens the SMS Outbox, filtered to one kind or all, and shoots it from the top down to the lowest of `rows` (the
 * board's own messages; other people's land in the same outbox, so the shot is cut where ours end).
 *
 * @param kind An SMS kind for the filter, or nothing for «همه».
 * @param rows Named texts, one per message the board points at.
 */
async function shootOutbox({ page, name, kind, rows }) {
  await go(page, kind ? `/admin/sms?kind=${kind}` : "/admin/sms");
  const targets = Object.fromEntries(Object.entries(rows).map(([key, text]) => [key, smsRow(page, text)]));
  for (const row of Object.values(targets)) await row.waitFor();
  const bottoms = await Promise.all(
    Object.values(targets).map((row) => row.evaluate((el) => el.getBoundingClientRect().bottom + scrollY)),
  );
  await shoot(
    page,
    name,
    { pill: page.locator("fieldset button[aria-pressed=true]").first(), ...targets },
    { maxHeight: Math.round(Math.max(...bottoms) + 16) },
  );
}

/*===== The customer and two dogs =====*/
const { context, page } = await signIn({ phone: CUSTOMER_PHONE, name: CUSTOMER });
await addDog({ page, go, name: OTHER_DOG, breed: "جک راسل", ageYears: 1 });
await addDog({ page, go, name: DOG, breed: "ژرمن شپرد", ageYears: 2 });
await requestEvaluation({ page, go, dogName: OTHER_DOG });

/*------ 1. The request ------*/
await requestEvaluation({ page, go, dogName: DOG });
await shoot(
  page,
  "01-request",
  {
    title: page.locator("h1").first(),
    receipt: page.locator("#receipt-title"),
  },
  { maxHeight: 1250 },
);

/*------ 2. Its SMS to the Admin ------*/
const { context: adminContext, page: admin } = await signIn({ phone: ADMIN_PHONE });
await shootOutbox({
  page: admin,
  name: "02-sms-request",
  kind: "evaluation-requested",
  rows: { sms: `درخواست ارزیابی تازه برای ${DOG}.` },
});

/*------ 3. Evaluated and rejected ------*/
await answerEvaluation({ page: admin, go, dogName: DOG, outcome: "evaluate" });
await answerEvaluation({ page: admin, go, dogName: OTHER_DOG, outcome: "reject", reason: REASON });
await shootOutbox({
  page: admin,
  name: "03-sms-answers",
  rows: { evaluated: `${DOG} ارزیابی شد`, rejected: `ارزیابی ${OTHER_DOG} پذیرفته نشد` },
});

/*------ 4. The customer's dogs ------*/
await go(page, "/account");
await shoot(
  page,
  "04-dogs",
  {
    evaluated: page.getByText("ارزیابی شد", { exact: true }).first(),
    reason: page.getByText(REASON).first(),
    courses: page.getByRole("link", { name: "دوره‌ها رو ببین" }).first(),
  },
  { maxHeight: 2230 },
);

/*------ 5. A purchase ------*/
await addToCart({ page, go, slug: "house-manner", dogName: DOG });
await payCart({ page, go });
await shoot(page, "05-paid", { banner: page.getByText(/پرداخت انجام شد/).first() }, { maxHeight: 900 });

/*------ 6. Its two SMS ------*/
await shootOutbox({
  page: admin,
  name: "06-sms-paid",
  rows: { receipt: `(${COURSE} برای ${DOG})`, admin: `خرید تازه از ${CUSTOMER_NAME}` },
});

/*------ 7. The course is done ------*/
await go(admin, "/admin/enrollments");
let block = admin.locator("article").filter({ hasText: CUSTOMER_NAME });
for (let n = 2; !(await block.count()) && n < 10; n += 1) {
  await go(admin, `/admin/enrollments?page=${n}`);
  block = admin.locator("article").filter({ hasText: CUSTOMER_NAME });
}
await block.getByRole("button", { name: "تمام شد" }).click();
await admin.getByRole("alertdialog").getByRole("button", { name: "تمام شد" }).click();
await admin.getByRole("alertdialog").waitFor({ state: "detached" });
await admin.waitForTimeout(1000);
await shootOutbox({
  page: admin,
  name: "07-sms-done",
  kind: "enrollment-completed",
  rows: { done: `برای ${DOG} تمام شد` },
});
await adminContext.close();

/*------ 8. The customer's dog after it ------*/
await go(page, "/account");
await shoot(
  page,
  "08-done",
  {
    passed: page.getByText("گذرونده", { exact: true }).first(),
    counts: page.getByText("دوره‌ی گذرونده").first(),
  },
  { maxHeight: 1660 },
);
await context.close();

await finish({ customerPhone: CUSTOMER_PHONE });
