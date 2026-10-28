// Builds the sign-in / sign-up journey board from the shots 01-sign-in.capture.mjs recorded.
// Usage: node scripts/feature-boards/01-sign-in.board.mjs [out.excalidraw]
import { ADMIN, RETURNING, ROW1, createBoard } from "./board-lib.mjs";

const { shots, header, step, nextArrow, turnArrow, write } = await createBoard({ name: "01-sign-in" });

/*===== Header =====*/
header({
  title: "ورود و ثبت‌نام در سایت (موبایل)",
  summary: "ورود و ثبت‌نام یکیه: شماره‌ی موبایل، بعد کد پیامکی. فقط بار اول اسم هم پرسیده می‌شه.",
  key: [
    { value: "سبز: مشتری قدیمی", color: RETURNING },
    { value: "آبی: پنل مدیریت", color: ADMIN },
  ],
});

/*===== Row 1: a new customer =====*/
/*------ 1. Home ------*/
const s1 = await step({
  name: "01-home",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "صفحه‌ی اصلی",
  notes: [{ box: "account", text: "ورود یا ثبت‌نام" }],
});

/*------ 2. Phone ------*/
const s2 = await step({
  name: "02-phone",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "شماره‌ی موبایل",
  notes: [
    { box: "stage", text: "سگ هر مرحله سؤالش رو می‌پرسه" },
    // The recorded box is the bare input; the field also holds the phone icon, so take the button's width.
    { area: { ...shots["02-phone"].boxes.phone, x: 37, w: 316 }, text: "فقط شماره‌ی موبایل" },
    { box: "password", text: "یا ورود با رمز، اگه از قبل رمز گذاشته باشه" },
    { box: "demo", text: "حساب‌های نمونه؛ فقط در نسخه‌ی نمایشی" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 320, label: "دکمه‌ی ورود" });

/*------ 3. Code ------*/
const s3 = await step({
  name: "03-code",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "کد پیامکی",
  notes: [
    { box: "otp", text: "کد ۵ رقمی که پیامک می‌شه" },
    { box: "hint", text: "نسخه‌ی نمایشی: کد همیشه ۱۲۳۴۵" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 640, label: "«کد ورود رو بفرست»" });

/*------ 4. Name (a new number only) ------*/
const name = shots["04-name"].boxes;
const s4 = await step({
  name: "04-name",
  col: 3,
  top: ROW1,
  number: "۴",
  title: "اسم (فقط بار اول)",
  notes: [
    {
      area: { x: name.first.x, y: name.first.y, w: name.first.w, h: name.last.y + name.last.h - name.first.y },
      text: "حساب ساخته شد؛ فقط اسمش مونده",
    },
  ],
});
nextArrow({ from: s3.shotX - 40, to: s4.right + 40, y: 640, label: "شماره‌ی تازه" });

/*------ 5. The new customer's account ------*/
const s5 = await step({
  name: "05-account-new",
  col: 4,
  top: ROW1,
  number: "۵",
  title: "حساب مشتری تازه",
  notes: [
    { box: "heading", text: "خوش‌آمد با اسم خودش" },
    { area: { x: 16, y: 495, w: 358, h: 250 }, text: "قدم بعد: معرفی سگ" },
  ],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: 640, label: "«ادامه»" });

/*===== Row 2 =====*/
const ROW2 = Math.max(s1.bottom, s2.bottom, s3.bottom, s4.bottom, s5.bottom) + 420;

/*------ 6. A returning customer ------*/
const s6 = await step({
  name: "06-account-returning",
  col: 3,
  top: ROW2,
  number: "۶",
  title: "مشتری قدیمی",
  color: RETURNING,
  titleColor: RETURNING,
  notes: [{ box: "heading", text: "بدون پرسیدن اسم، مستقیم به حسابش" }],
});
// From the code step, down and left past the name step.
turnArrow({ from: s3, to: s6, label: "شماره‌ی قبلی", color: RETURNING });

/*------ 7. The Admin's side ------*/
const s7 = await step({
  name: "07-admin-users",
  col: 5,
  top: ROW2,
  number: "۷",
  title: "پنل مدیریت: کاربران",
  color: ADMIN,
  titleColor: ADMIN,
  // The whole row, from its name line.
  notes: [
    {
      area: { x: 16, y: shots["07-admin-users"].boxes.row.y - 12, w: 358, h: 78 },
      text: "مشتری تازه همون لحظه اینجاست",
    },
  ],
});
turnArrow({ from: s5, to: s7, label: "پنل مدیریت", color: ADMIN });

await write(process.argv[2]);
