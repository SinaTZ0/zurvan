// Builds the partners board (F7) from the shots 07-partners.capture.mjs recorded.
// Usage: node scripts/feature-boards/07-partners.board.mjs [out.excalidraw]
import { ADMIN, CALLOUT, RETURNING, ROW1, createBoard } from "./board-lib.mjs";

const { shots, header, step, nextArrow, turnArrow, write } = await createBoard({ name: "07-partners" });

/*===== Header =====*/
header({
  title: "همکارها، لینکشون و پورسانت",
  summary: "مشتری با لینک یا شماره‌ای که همکار داده به اسم همکار ثبت می‌شه؛ از هر خریدش پورسانت می‌نویسه.",
  key: [
    { value: "قرمز: صفحه‌ی همکار", color: CALLOUT },
    { value: "سبز: مشتری‌ای که همکار آورده", color: RETURNING },
    { value: "آبی: پنل مدیریت", color: ADMIN },
  ],
});

/*===== Row 1: from a new partner to his first commission =====*/
/*------ 1. The Admin opens the partner's account ------*/
const s1 = await step({
  name: "01-create",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "پنل مدیریت: همکار تازه",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "name", text: "اسم و فامیل همکار" },
    { box: "phone", text: "با همین شماره و کد پیامکی وارد می‌شه" },
    { box: "code", text: "کد لینک اختیاریه؛ خالی بذاری خودش می‌سازه" },
    { box: "link", text: "لینکش همون موقع دیده می‌شه؛ بعداً عوض نمی‌شه" },
    { area: { ...shots["01-create"].boxes.submit, w: 350 }, text: "«ساختن حساب»" },
  ],
});

/*------ 2. The partner's dashboard ------*/
const dashboard = shots["02-dashboard"].boxes;
const s2 = await step({
  name: "02-dashboard",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "صفحه‌ی همکار",
  notes: [
    { box: "hello", text: "همکار با شماره‌ش وارد می‌شه و صفحه‌ی خودش رو می‌بینه" },
    { box: "counts", text: "شماره‌ها، ثبت‌نامی‌ها و خریدارهاش؛ هنوز خالیه" },
    // The notice card between the counts and the QR.
    {
      area: {
        x: 17,
        y: dashboard.counts.y + dashboard.counts.h + 40,
        w: 357,
        h: dashboard.qr.y - dashboard.counts.y - dashboard.counts.h - 100,
      },
      text: "تا شماره شبا ننوشته، یادش می‌ندازه",
    },
    {
      area: { x: 17, y: dashboard.qr.y + 50, w: 357, h: dashboard.link.y - dashboard.qr.y - 70 },
      text: "QR لینکش، برای کنار صندوق مغازه",
    },
    { box: "link", text: "کپی لینک، برای فرستادن" },
    { box: "download", text: "QR رو دانلود می‌کنه که چاپ کنه" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 330, label: "همکار وارد می‌شه" });

/*------ 3. A phone lead ------*/
const s3 = await step({
  name: "03-lead",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "شماره‌ی یه مشتری",
  notes: [
    { box: "form", text: "شماره‌ی کسی که قراره ثبت‌نام کنه" },
    { box: "submit", text: "«ثبت شماره»؛ دیگه پاک یا عوض نمی‌شه" },
    { box: "how", text: "اینجا توضیح می‌ده چطور حساب می‌شه" },
    { box: "row", text: "شماره توی لیست، منتظر ثبت‌نام" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 1150, label: "«مشتری‌ها»" });

/*------ 4. A customer who came through the link ------*/
const s4 = await step({
  name: "04-customer",
  col: 3,
  top: ROW1,
  number: "۴",
  title: "مشتری با لینک ثبت‌نام کرد",
  notes: [
    { box: "counts", text: "یکی ثبت‌نام کرده، یکی در راهه" },
    { box: "customer", text: "مشتری‌ای که با لینک اومد، با اسمش: «از لینک»" },
    { box: "lead", text: "شماره‌ای که خودش نوشت هنوز منتظره" },
  ],
});
nextArrow({ from: s3.shotX - 40, to: s4.right + 40, y: 330, label: "ثبت‌نام با لینک" });

/*------ 5. The customer pays ------*/
const s5 = await step({
  name: "05-paid",
  col: 4,
  top: ROW1,
  number: "۵",
  title: "مشتری دوره خرید",
  color: RETURNING,
  titleColor: RETURNING,
  notes: [{ box: "banner", text: "سگش ارزیابی شد و یه دوره خرید؛ پرداخت انجام شد" }],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: 330, label: "ارزیابی، بعد خرید" });

/*------ 6. The commission ------*/
const s6 = await step({
  name: "06-commission",
  col: 5,
  top: ROW1,
  number: "۶",
  title: "پورسانت همکار",
  notes: [
    { box: "funnel", text: "حالا یه خریدار داره" },
    { box: "pending", text: "پورسانت منتظر پرداخت" },
    { box: "steps", text: "پله‌های درصد؛ الان روی پله‌ی اوله" },
    { box: "next", text: "چند تا خریدار آورده و مشتری بعدی با چند درصد حساب می‌شه" },
    { box: "row", text: "پورسانت این مشتری؛ مبلغ خرید و دوره رو نمی‌بینه" },
  ],
});
nextArrow({ from: s5.shotX - 40, to: s6.right + 40, y: 330, label: "همکار سر می‌زنه" });

/*===== Row 2: the Admin pays it =====*/
const ROW2 = Math.max(s1.bottom, s2.bottom, s3.bottom, s4.bottom, s5.bottom, s6.bottom) + 420;

/*------ 7. The Admin marks it paid ------*/
const s7 = await step({
  name: "07-admin-pay",
  col: 6,
  top: ROW2,
  number: "۷",
  title: "پنل مدیریت: پرداخت پورسانت",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "partner", text: "تو «همکاران»، تب «پرداخت‌نشده»" },
    { box: "sheba", text: "شبای همکار؛ اگه ننوشته باشه، شماره‌ش رو می‌ده که زنگ بزنی" },
    { box: "line", text: "پورسانت این مشتری، ۱۰٪ از خریدش" },
    { box: "pay", text: "پول رو از بانک می‌فرستی، بعد «پرداخت شد»؛ به همکار پیامک می‌ره" },
  ],
});
turnArrow({ from: s6, to: s7, label: "پنل مدیریت", color: ADMIN });

/*------ 8. The partner sees it paid ------*/
const s8 = await step({
  name: "08-paid",
  col: 7,
  top: ROW2,
  number: "۸",
  title: "همکار می‌بینه پرداخت شد",
  notes: [
    { box: "paid", text: "رفت توی «پرداخت‌شده»" },
    { box: "row", text: "کنار اسم مشتری: «پرداخت شد» با تاریخ" },
  ],
});
nextArrow({ from: s7.shotX - 40, to: s8.right + 40, y: ROW2 + 300, label: "«بله، پرداخت شد»" });

await write(process.argv[2]);
