// Builds the notifications board (F9) from the shots 08-notifications.capture.mjs recorded.
// Usage: node scripts/feature-boards/08-notifications.board.mjs [out.excalidraw]
import { ADMIN, CALLOUT, ROW1, createBoard } from "./board-lib.mjs";

const { shots, header, step, nextArrow, write } = await createBoard({ name: "08-notifications" });

/*===== Header =====*/
header({
  title: "پیامک‌ها",
  summary: "هر اتفاق مهم یه پیامک می‌فرسته؛ روی سایت نمایشی پیامک‌ها نمی‌رن و توی «پیامک‌ها» جمع می‌شن.",
  key: [
    { value: "قرمز: صفحه‌ی مشتری", color: CALLOUT },
    { value: "آبی: پنل مدیریت، صفحه‌ی «پیامک‌ها»", color: ADMIN },
  ],
});

/** An outbox step: blue, with its filter pill noted first. */
const outbox = ({ notes, ...rest }) => step({ ...rest, top: ROW1, color: ADMIN, titleColor: ADMIN, notes });

/*===== Steps =====*/
/*------ 1. The request ------*/
const request = shots["01-request"].boxes;
const s1 = await step({
  name: "01-request",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "مشتری ارزیابی می‌خواد",
  notes: [
    { box: "title", text: "مشتری برای سگش ارزیابی رایگان درخواست می‌ده" },
    // The receipt card, from its heading down to the dates.
    { area: { x: 16, y: request.receipt.y - 40, w: 358, h: 430 }, text: "رسیدش همین‌جاست؛ مشتری پیامکی نمی‌گیره" },
  ],
});

/*------ 2. Its SMS to the Admin ------*/
const s2 = await outbox({
  name: "02-sms-request",
  col: 1,
  number: "۲",
  title: "پیامک به تو",
  notes: [
    { box: "pill", text: "هر نوع پیامک یه دکمه داره؛ اینجا «درخواست ارزیابی»" },
    { box: "sms", text: "اسم سگ و لینک مستقیم به همون درخواست" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 120, label: "«درخواست ارزیابی رایگان»" });

/*------ 3. Evaluated and rejected ------*/
const s3 = await outbox({
  name: "03-sms-answers",
  col: 2,
  number: "۳",
  title: "جواب ارزیابی به مشتری",
  notes: [
    { box: "rejected", text: "رد: دلیلی که نوشتی هم توی پیامکه" },
    { box: "evaluated", text: "ارزیابی شد: «می‌تونی دوره‌هاش رو بخری»" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 120, label: "تو: «ارزیابی شد» و «رد»" });

/*------ 4. The customer's dogs ------*/
const s4 = await step({
  name: "04-dogs",
  col: 3,
  top: ROW1,
  number: "۴",
  title: "همون خبر توی «سگ‌های من»",
  notes: [
    { box: "evaluated", text: "سگ ارزیابی‌شده؛ برچسبش عوض شده" },
    { box: "courses", text: "دوره‌هاش باز شدن" },
    { box: "reason", text: "سگ ردشده: دلیلت رو اینجا هم می‌بینه و دوباره می‌تونه درخواست بده" },
  ],
});
nextArrow({ from: s3.shotX - 40, to: s4.right + 40, y: 120, label: "مشتری سایت رو باز می‌کنه" });

/*------ 5. A purchase ------*/
const s5 = await step({
  name: "05-paid",
  col: 4,
  top: ROW1,
  number: "۵",
  title: "مشتری دوره خرید",
  notes: [{ box: "banner", text: "بعد از پرداخت همین رو روی سایت می‌بینه" }],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: 120, label: "خرید دوره" });

/*------ 6. Its two SMS ------*/
const s6 = await outbox({
  name: "06-sms-paid",
  col: 5,
  number: "۶",
  title: "دو پیامک خرید",
  notes: [
    { box: "admin", text: "به تو: کی خرید، چه دوره‌ای، برای کدوم سگ و کجا؛ که زنگ بزنی" },
    { box: "receipt", text: "به مشتری: رسید خرید" },
  ],
});
nextArrow({ from: s5.shotX - 40, to: s6.right + 40, y: 120, label: "«پیامک‌ها»" });

/*------ 7. The course is done ------*/
const s7 = await outbox({
  name: "07-sms-done",
  col: 6,
  number: "۷",
  title: "دوره تموم شد",
  notes: [
    { box: "pill", text: "دکمه‌ی «تمام شد»" },
    { box: "done", text: "به مشتری: دوره تموم شد و تبریک" },
  ],
});
nextArrow({ from: s6.shotX - 40, to: s7.right + 40, y: 120, label: "تو: «تمام شد» توی «ثبت‌نام‌ها»" });

/*------ 8. The customer's dog after it ------*/
const done = shots["08-done"].boxes;
const s8 = await step({
  name: "08-done",
  col: 7,
  top: ROW1,
  number: "۸",
  title: "مشتری دوره‌ی گذرونده رو می‌بینه",
  notes: [
    // The hero's three counts, around «دوره‌ی گذرونده».
    { area: { x: 17, y: done.counts.y - 40, w: 357, h: 84 }, text: "یه دوره‌ی گذرونده" },
    { area: { ...done.passed, h: done.passed.h + 34 }, text: "روی کارت سگ: گذرونده، با اسم دوره" },
  ],
});
nextArrow({ from: s7.shotX - 40, to: s8.right + 40, y: 120, label: "مشتری سایت رو باز می‌کنه" });

await write(process.argv[2]);
