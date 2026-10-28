// Builds the Admin Dashboard board (F11) from the shots 10-admin-dashboard.capture.mjs recorded.
// Usage: node scripts/feature-boards/10-admin-dashboard.board.mjs [out.excalidraw]
import { ADMIN, ROW1, createBoard } from "./board-lib.mjs";

const { shots, header, step, nextArrow, turnArrow, write } = await createBoard({ name: "10-admin-dashboard" });

/*===== Header =====*/
header({
  title: "نمای کلی پنل مدیریت",
  summary: "هر بار که پنل رو باز می‌کنی: کارهای منتظر، ثبت‌نام‌ها، پول و دوره‌ها؛ هر عدد لیست خودش رو باز می‌کنه.",
  key: [{ value: "آبی: پنل مدیریت", color: ADMIN }],
});

/** Every step here is the Admin's: blue. */
const adminStep = (props) => step({ ...props, color: ADMIN, titleColor: ADMIN });

/*===== Row 1: waiting for her =====*/
/*------ 1. Waiting for her ------*/
const s1 = await adminStep({
  name: "01-waiting",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "منتظر توست",
  notes: [
    { box: "title", text: "اولین صفحه‌ی پنل؛ عددها همون لحظه‌ان و با تست‌های دیگه عوض می‌شن" },
    { box: "evaluations", text: "درخواست‌های ارزیابی که هنوز جواب ندادی" },
    { box: "flagged", text: "پولش گرفته شده ولی ثبت‌نام نشده؛ باید پس بدی" },
    { box: "latest", text: "آخرین خریدها، که زنگ بزنی" },
    { box: "call", text: "شماره‌ی مشتری؛ بزنی زنگ می‌خوره" },
  ],
});

/*------ 2. The evaluation requests ------*/
const s2 = await adminStep({
  name: "02-evaluations",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "ارزیابی‌های منتظر",
  notes: [
    { box: "pill", text: "خودش روی «در انتظار» باز می‌شه" },
    { box: "first", text: "همون درخواست‌ها؛ بزنی جزئیاتش باز می‌شه" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 150, label: "عدد درخواست‌ها" });

/*------ 3. Paid, not enrolled ------*/
const s3 = await adminStep({
  name: "03-flagged",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "پرداخت شد ولی ثبت‌نام نشد",
  notes: [
    { box: "pill", text: "روی «بدون ثبت‌نام» باز می‌شه" },
    { box: "first", text: "خریدی که دوره‌ش ثبت نشد؛ پایینش بازپرداخت رو ثبت می‌کنی" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 150, label: "«پولش گرفته شده…»" });

/*===== Row 2: enrollments, money and courses =====*/
const ROW2 = Math.max(s1.bottom, s2.bottom, s3.bottom) + 420;

/*------ 4. Enrollments, money and courses ------*/
const numbers = shots["04-numbers"].boxes;
const s4 = await adminStep({
  name: "04-numbers",
  col: 1,
  top: ROW2,
  number: "۴",
  title: "ثبت‌نام‌ها، پول و دوره‌ها",
  notes: [
    {
      area: { ...numbers.cancelled, w: numbers.active.x + numbers.active.w - numbers.cancelled.x },
      text: "در حال آموزش، تمام‌شده و لغوشده",
    },
    { box: "month", text: "دریافتی این ماه" },
    { box: "total", text: "دریافتی تا امروز" },
    { box: "commissions", text: "پورسانت‌هایی که هنوز به همکارها ندادی" },
    { box: "courses", text: "هر دوره: چند تا خرید، در حال آموزش و تمام‌شده" },
  ],
});
turnArrow({ from: s1, to: s4, label: "پایین‌تر توی همین صفحه", color: ADMIN });

/*------ 5. Active enrollments ------*/
const s5 = await adminStep({
  name: "05-enrollments",
  col: 2,
  top: ROW2,
  number: "۵",
  title: "ثبت‌نام‌های در حال آموزش",
  notes: [
    { box: "pill", text: "روی «در حال آموزش» باز می‌شه" },
    { box: "first", text: "هر مشتری با شماره‌ش و دوره‌هاش؛ «تمام شد» یا «لغو»" },
  ],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: ROW2 + 150, label: "«در حال آموزش»" });

/*------ 6. Unpaid commissions ------*/
const s6 = await adminStep({
  name: "06-commissions",
  col: 3,
  top: ROW2,
  number: "۶",
  title: "پورسانت‌های پرداخت‌نشده",
  notes: [
    { box: "pill", text: "روی «پرداخت‌نشده» باز می‌شه" },
    { box: "first", text: "هر همکار با شبا و پورسانت‌هاش؛ «پرداخت شد»" },
  ],
});
nextArrow({ from: s5.shotX - 40, to: s6.right + 40, y: ROW2 + 150, label: "«پورسانت پرداخت‌نشده»" });

await write(process.argv[2]);
