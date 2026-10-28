// Captures the dog's file (its number and QR code), the logbook (the Admin writes a session, the owner reads it), the
// public lookup and what a stranger sees for a QR code, and a certificate issued, checked and revoked. The board's own
// customer and dog are set up through the site first: a dog the Admin marks evaluated, one course bought and paid
// through the demo gateway, and marked finished by the Admin.
// Usage: node scripts/feature-boards/13-dog-file-certificate.capture.mjs [base-url]
import { ADMIN_PHONE, createCapture } from "./capture-lib.mjs";
import { freshPhone } from "./board-lib.mjs";
import { addDog, adminMarkEvaluated } from "./journey-lib.mjs";

const { go, newPage, shoot, signIn, finish } = await createCapture({ board: "13-dog-file-certificate" });

const OWNER_PHONE = freshPhone();
const OWNER = { first: "الهام", last: "نوری" };
const DOG = "بارون";
const COURSE = "سگ خونگی";
const SESSION = {
  notes: "نشستن و موندن کنار در رو کار کردیم؛ با صدای زنگ هنوز بلند می‌شه.",
  exercises: "بشین\nبمون کنار در\nبیا با صدا زدن",
  progress: "از هفته‌ی قبل آروم‌تره",
};
const REVOKE_REASON = "اشتباهی صادر شد؛ دوره‌ی درستش هنوز تموم نشده.";

/**
 * Where a section starts on the page (its heading's top, minus room for the mascot above it), for a shot's `top`.
 *
 * @param lead How far above the heading the shot starts.
 */
async function sectionTop({ page, heading, lead }) {
  const b = await heading.boundingBox();
  const scrollY = await page.evaluate(() => window.scrollY);
  return Math.max(0, Math.round(b.y + scrollY - lead));
}

/*===== Setup: an evaluated dog with one finished course =====*/
const owner = await signIn({ phone: OWNER_PHONE, name: OWNER });
const dogId = await addDog({
  page: owner.page,
  go,
  name: DOG,
  breed: "ژرمن شپرد",
  ageYears: 2,
  photo: "app/db/seed-images/dog-leo.jpg",
});
await adminMarkEvaluated({ signIn, go, dogId });

/*------ The owner buys the course and pays (the demo gateway comes straight back to the cart) ------*/
await go(owner.page, `/buy?dog=${dogId}`);
await owner.page
  .getByRole("heading", { name: COURSE, exact: true })
  .locator("xpath=following::button[contains(., 'افزودن به سبد')][1]")
  .click();
await owner.page.waitForTimeout(1500);
await go(owner.page, "/account/cart");
await owner.page.getByText("منزل", { exact: true }).first().click();
await owner.page.getByRole("button", { name: "پرداخت" }).click();
await owner.page.waitForURL(/\/account\/cart\?/, { timeout: 30000 }).catch(() => {});
await owner.page.waitForLoadState("networkidle");

/*------ The Admin marks it finished ------*/
const admin = await signIn({ phone: ADMIN_PHONE });
await go(admin.page, "/admin/enrollments");
// The innermost line (a customer's block is a list item too); the newest customer is on top.
await admin.page
  .locator("li:not(:has(li))")
  .filter({ hasText: DOG })
  .filter({ has: admin.page.getByRole("button", { name: "تمام شد" }) })
  .first()
  .getByRole("button", { name: "تمام شد" })
  .click();
await admin.page.getByRole("alertdialog").getByRole("button", { name: "تمام شد" }).click();
await admin.page.getByRole("alertdialog").waitFor({ state: "detached" });
await admin.page.waitForTimeout(1500);

/*===== Admin: a session in the logbook =====*/
await go(admin.page, `/admin/dogs/${dogId}`);
await admin.page.getByRole("button", { name: "ثبت جلسه" }).click();
// Toasts are dialogs too: the sheet by its slot.
const sheet = admin.page.locator("[data-slot=sheet-content]");
await sheet.locator("#session-notes").waitFor();
await sheet.locator("#session-course").selectOption({ label: COURSE });
await sheet.locator("#session-notes").fill(SESSION.notes);
await sheet.locator("#session-exercises").fill(SESSION.exercises);
await sheet.locator("#session-progress").fill(SESSION.progress);
await sheet.locator("#session-progress").blur();
// The sheet scrolls to the field being typed in; back to its top, so the day shows.
await sheet.locator("#session-notes").evaluate((el) => {
  let node = el.parentElement;
  while (node && node.scrollHeight <= node.clientHeight) node = node.parentElement;
  if (node) node.scrollTop = 0;
});
await shoot(
  admin.page,
  "07-session",
  {
    day: sheet.getByRole("combobox", { name: "روز" }).locator("xpath=ancestor::fieldset[1]"),
    course: sheet.locator("#session-course"),
    notes: sheet.locator("#session-notes"),
    exercises: sheet.locator("#session-exercises"),
    save: sheet.getByRole("button", { name: "ذخیره" }),
  },
  { maxHeight: 844 },
);
await sheet.getByRole("button", { name: "ذخیره" }).click();
await sheet.waitFor({ state: "detached" });
await admin.page.waitForTimeout(3500); // the toast fades

/*===== Admin: issuing the certificate =====*/
{
  const top = await sectionTop({ page: admin.page, heading: admin.page.locator("#certificates-title"), lead: 30 });
  await shoot(
    admin.page,
    "08-issue",
    {
      course: admin.page.locator("#certificates-title").locator("xpath=../..").getByText(COURSE).first(),
      issue: admin.page.getByRole("button", { name: "صدور گواهی" }),
      session: admin.page.getByRole("button", { name: /ویرایش جلسه‌ی/ }).first(),
      add: admin.page.getByRole("button", { name: "ثبت جلسه" }),
    },
    { top, maxHeight: 560 },
  );
}
await admin.page.getByRole("button", { name: "صدور گواهی" }).click();
await admin.page.getByRole("alertdialog").getByRole("button", { name: "صدور گواهی" }).click();
await admin.page.getByRole("alertdialog").waitFor({ state: "detached" });
const certificateLink = admin.page.getByRole("link", { name: /^گواهی ZC-/ }).first();
await certificateLink.waitFor();
const certificateNumber = (await certificateLink.innerText()).trim();

/*===== The owner's dog page =====*/
await go(owner.page, `/account/dogs/${dogId}`);
await owner.page.waitForTimeout(800);

/*------ 1. The file card ------*/
{
  const top = await sectionTop({ page: owner.page, heading: owner.page.locator("#dog-file-title"), lead: 150 });
  await shoot(
    owner.page,
    "01-file",
    {
      number: owner.page
        .locator("#dog-file-title")
        .locator("xpath=following::*[starts-with(normalize-space(text()), 'ZD-')][1]"),
      note: owner.page.getByText(/فقط می‌بینه که پرونده/).first(),
      copy: owner.page.getByRole("button", { name: "کپی لینک" }).last(),
      download: owner.page.getByRole("button", { name: "دانلود QR برای چاپ" }),
    },
    { top, maxHeight: 590 },
  );
}
const fileNumber = (
  await owner.page
    .locator("#dog-file-title")
    .locator("xpath=following::*[starts-with(normalize-space(text()), 'ZD-')][1]")
    .innerText()
).trim();

/*------ 2. The certificate and the logbook ------*/
{
  const top = await sectionTop({ page: owner.page, heading: owner.page.locator("#certificates-title"), lead: 110 });
  const bottom = await sectionTop({ page: owner.page, heading: owner.page.locator("#evaluations-title"), lead: 60 });
  await shoot(
    owner.page,
    "02-certificate-logbook",
    {
      certificate: owner.page.locator("#certificates-title").locator("xpath=following::h3[1]"),
      certificateNumber: owner.page.getByText(certificateNumber, { exact: true }).first(),
      copy: owner.page.getByRole("button", { name: "کپی لینک" }).first(),
      session: owner.page.locator("#logbook-title").locator("xpath=following::h3[1]"),
      notes: owner.page.getByText(SESSION.notes).first(),
      exercises: owner.page.getByText("بمون کنار در").first(),
    },
    { top, maxHeight: bottom - top },
  );
}
await owner.context.close();

/*===== A stranger: the lookup and the QR code =====*/
const stranger = await newPage();

/*------ 3. The lookup, typed loosely ------*/
await go(stranger.page, "/logbook");
await stranger.page.locator("#logbook-file-number").fill(fileNumber.replace(/^ZD-/, "").toLowerCase());
await shoot(
  stranger.page,
  "03-lookup",
  {
    title: stranger.page.locator("#logbook-title"),
    field: stranger.page.locator("#logbook-file-number"),
    open: stranger.page.getByRole("button", { name: "باز کن" }),
  },
  { maxHeight: 860 },
);

/*------ 4. What a stranger sees ------*/
await stranger.page.getByRole("button", { name: "باز کن" }).click();
await stranger.page.waitForURL(/\/logbook\/ZD-/);
await stranger.page.locator("#logbook-title").waitFor();
await stranger.page.waitForLoadState("networkidle");
await shoot(
  stranger.page,
  "04-private",
  {
    title: stranger.page.locator("#logbook-title"),
    signIn: stranger.page.getByRole("link", { name: "ورود" }).last(),
    other: stranger.page.getByRole("link", { name: "یه شماره‌ی دیگه بنویس" }),
    who: stranger.page.locator("#logbook-who-title"),
  },
  { maxHeight: 1000 },
);

/*------ 5. The certificate checks out ------*/
await go(stranger.page, `/certificate/${certificateNumber}`);
await shoot(
  stranger.page,
  "05-valid",
  {
    title: stranger.page.locator("#certificate-title"),
    course: stranger.page.getByText(COURSE, { exact: true }).first(),
    issuer: stranger.page.getByRole("link", { name: "طلا راستی" }).first(),
    number: stranger.page.getByText(certificateNumber, { exact: true }).first(),
  },
  { maxHeight: 870 },
);

/*===== Admin: revoking it =====*/
await go(admin.page, `/admin/dogs/${dogId}`);
await admin.page.getByRole("button", { name: "باطل کردن" }).first().click();
const revoke = admin.page.getByRole("dialog", { name: /باطل بشه/ });
await revoke.locator("#revoke-reason").fill(REVOKE_REASON);
await shoot(
  admin.page,
  "09-revoke",
  {
    title: revoke.getByRole("heading").first(),
    reason: revoke.locator("#revoke-reason"),
    confirm: revoke.getByRole("button", { name: "باطل کن" }),
  },
  { maxHeight: 844 },
);
await revoke.getByRole("button", { name: "باطل کن" }).click();
await revoke.waitFor({ state: "detached" });
await admin.page.waitForTimeout(1000);
await admin.context.close();

/*------ 6. The same certificate, revoked ------*/
await go(stranger.page, `/certificate/${certificateNumber}`);
await shoot(
  stranger.page,
  "06-revoked",
  {
    title: stranger.page.locator("#certificate-title"),
    number: stranger.page.getByText(certificateNumber, { exact: true }).first(),
    when: stranger.page.getByText(/باطل شد/).last(),
  },
  { maxHeight: 620 },
);
await stranger.context.close();

await finish({ ownerPhone: OWNER_PHONE, dogId, fileNumber, certificateNumber });
