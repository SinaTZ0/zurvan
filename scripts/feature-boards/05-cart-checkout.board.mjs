// Builds the cart and checkout board (F5) from the shots 05-cart-checkout.capture.mjs recorded.
// Usage: node scripts/feature-boards/05-cart-checkout.board.mjs [out.excalidraw]
import { ADMIN, CALLOUT, ROW1, createBoard } from "./board-lib.mjs";

const { shots, header, step, nextArrow, turnArrow, write } = await createBoard({ name: "05-cart-checkout" });

/** One box around two recorded boxes (e.g. two pills side by side). */
const around = (a, b) => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

/*===== Header =====*/
header({
  title: "سبد خرید و پرداخت",
  summary: "مشتری دوره رو برای سگ ارزیابی‌شده‌ش توی سبد می‌ذاره، جای آموزش رو انتخاب می‌کنه و پرداخت می‌کنه.",
  key: [
    { value: "قرمز: مشتری", color: CALLOUT },
    { value: "آبی: پنل مدیریت", color: ADMIN },
  ],
});

/*===== Row 1: the customer buys =====*/
/*------ 1. Added on the course page ------*/
const s1 = await step({
  name: "01-added",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "افزودن به سبد",
  notes: [
    { box: "cart", text: "سبد بالای صفحه عدد گرفت" },
    { box: "place", text: "جاهایی که این دوره درس داده می‌شه" },
    { box: "dog", text: "جکی ارزیابی شده: «می‌تونه»" },
    { box: "inCart", text: "بعد از «افزودن به سبد»: «در سبد است»" },
  ],
});

/*------ 2. The cart, place not picked yet ------*/
const s2 = await step({
  name: "02-cart",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "سبد: کجا آموزش ببینه؟",
  notes: [
    { box: "item", text: "دوره برای کدوم سگ، با قیمت امروز" },
    { box: "places", text: "منزل یا پانسیون؛ همون جاهایی که برای این دوره تیک زدی" },
    { box: "pay", text: "تا جا انتخاب نشه، «پرداخت» خاموشه" },
    { box: "missing", text: "می‌گه چند تا دوره هنوز جا ندارن" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 420, label: "«دیدن سبد»" });

/*------ 3. Boarding picked ------*/
const s3 = await step({
  name: "03-place",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "پانسیون رو انتخاب کرد",
  notes: [
    { box: "boarding", text: "«پانسیون»" },
    { box: "note", text: "هزینه‌ی پانسیون توی قیمت نیست؛ تلفنی باهاش هماهنگ می‌کنی" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 420, label: "«پانسیون»" });

/*------ 4. «کی هماهنگ کنیم؟» and «پرداخت» ------*/
const s4 = await step({
  name: "04-when-pay",
  col: 3,
  top: ROW1,
  number: "۴",
  title: "کی هماهنگ کنیم؟ و پرداخت",
  notes: [
    { box: "when", text: "اختیاریه؛ فقط ترجیحه و چیزی رزرو نمی‌شه" },
    { box: "days", text: "روزهایی که معمولاً آزاده" },
    { box: "periods", text: "صبح، بعدازظهر یا عصر و شب" },
    { box: "total", text: "زیر جمع هم یادآوری پانسیون هست" },
    { box: "pay", text: "«پرداخت» می‌ره درگاه بانک" },
  ],
});
nextArrow({ from: s3.shotX - 40, to: s4.right + 40, y: 420, label: "پایین‌تر" });

/*------ 5. Back from the gateway ------*/
const s5 = await step({
  name: "05-paid",
  col: 4,
  top: ROW1,
  number: "۵",
  title: "برگشت از درگاه",
  notes: [
    { box: "banner", text: "«پرداخت انجام شد»؛ سبد خالی شد" },
    { box: "purchases", text: "«دیدن خریدها»" },
    { box: "next", text: "بعدش: تو زنگ می‌زنی، آموزش، تموم شد" },
  ],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: 420, label: "«پرداخت»" });

/*------ 6. Purchases ------*/
const purchases = shots["06-purchases"].boxes;
const s6 = await step({
  name: "06-purchases",
  col: 5,
  top: ROW1,
  number: "۶",
  title: "خریدهام",
  notes: [
    // The receipt's top row: the state, the date and (under it) the amount.
    { area: { ...purchases.paid, x: 26, w: 338 }, text: "رسید: «پرداخت شد»، با تاریخ و مبلغ" },
    { box: "when", text: "وقت‌های آزادی که گفته" },
    {
      area: around(purchases.status, purchases.place),
      text: "جای آموزش: پانسیون (طلایی)؛ «در حال آموزش» تا وقتی تو «تمام شد» بزنی",
    },
    { box: "note", text: "یادآوری هزینه‌ی پانسیون" },
  ],
});
nextArrow({ from: s5.shotX - 40, to: s6.right + 40, y: 420, label: "«دیدن خریدها»" });

/*===== Row 2: the Admin's Payments =====*/
const ROW2 = Math.max(s1.bottom, s2.bottom, s3.bottom, s4.bottom, s5.bottom, s6.bottom) + 420;

/*------ 7. Payments ------*/
const s7 = await step({
  name: "07-admin-payments",
  col: 6,
  top: ROW2,
  number: "۷",
  title: "پنل: پرداخت‌ها",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "tabs", text: "همه‌ی پرداخت‌ها؛ تازه‌ترین بالا" },
    { box: "call", text: "اسم و شماره‌ش؛ بزنی زنگ می‌زنه" },
    { box: "when", text: "وقت‌های آزادش، کنار شماره" },
    { box: "place", text: "پانسیون طلاییه: یعنی سر هزینه‌ش باید تماس بگیری" },
    { box: "refund", text: "اگه پولی پس دادی، از اینجا ثبتش می‌کنی" },
  ],
});
turnArrow({ from: s6, to: s7, label: "پنل مدیریت", color: ADMIN });

await write(process.argv[2]);
