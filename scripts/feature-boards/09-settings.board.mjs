// Builds the settings board (F10) from the shots 09-settings.capture.mjs recorded.
// Usage: node scripts/feature-boards/09-settings.board.mjs [out.excalidraw]
import { ADMIN, RETURNING, ROW1, createBoard } from "./board-lib.mjs";

const { shots, header, step, nextArrow, write } = await createBoard({ name: "09-settings" });

/*===== Header =====*/
header({
  title: "تنظیمات پنل",
  summary: "پورسانت همکارها، پیش‌پرداخت و محدودیت کد ورود؛ هر تغییر همون لحظه اجرا می‌شه و همیشه می‌شه برگردوند.",
  key: [
    { value: "آبی: پنل مدیریت", color: ADMIN },
    { value: "سبز: سبد مشتری", color: RETURNING },
  ],
});

/*------ 1. The way in ------*/
const s1 = await step({
  name: "01-menu",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "منوی «بیشتر»",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [{ box: "settings", text: "پایین همه، «تنظیمات»" }],
});

/*------ 2. The commission steps ------*/
const commission = shots["02-commission"].boxes;
const s2 = await step({
  name: "02-commission",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "پله‌های پورسانت همکار",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "rules", text: "اول توضیح می‌ده هر پله چطور حساب می‌شه" },
    // The five rows, from the first percent down to the last.
    {
      area: { x: 37, y: commission.first.y, w: 316, h: commission.last.y + commission.last.h - commission.first.y },
      text: "همیشه پنج پله: از مشتری چندم، چند درصد",
    },
    { box: "example", text: "یه مثال با عدد، که بدونی چی می‌شه" },
    { box: "save", text: "هر پنج پله با هم ذخیره می‌شن" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 420, label: "«تنظیمات»" });

/*------ 3. The deposit set to 50% ------*/
const s3 = await step({
  name: "03-deposit",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "پیش‌پرداخت ۵۰ درصد",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "input", text: "مثلاً ۵۰ بنویس و «ذخیره» بزن" },
    { box: "example", text: "زیرش با عدد می‌گه الان چقدر گرفته می‌شه" },
    { box: "changed", text: "تاریخ آخرین تغییر" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 420, label: "پایین‌تر" });

/*------ 4. What the customer's cart says ------*/
const s4 = await step({
  name: "04-cart",
  col: 3,
  top: ROW1,
  number: "۴",
  title: "سبد مشتری همون لحظه",
  color: RETURNING,
  titleColor: RETURNING,
  notes: [
    { box: "due", text: "عدد بزرگ پیش‌پرداخته؛ بقیه موقع هماهنگی" },
    { box: "pay", text: "درگاه فقط همون پیش‌پرداخت رو می‌گیره" },
  ],
});
nextArrow({ from: s3.shotX - 40, to: s4.right + 40, y: 300, label: "سبد یه مشتری" });

/*------ 5. Back to the default ------*/
const s5 = await step({
  name: "05-deposit-default",
  col: 4,
  top: ROW1,
  number: "۵",
  title: "برگشت به پیش‌فرض",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "reset", text: "«برگردوندن به پیش‌فرض» عدد رو ۱۰۰ می‌کنه" },
    { box: "save", text: "بعد «ذخیره»؛ تا اونو نزنی، همون ۵۰ می‌مونه" },
  ],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: 200, label: "دوباره تنظیمات" });

/*------ 6. The sign-in code limits ------*/
const s6 = await step({
  name: "06-codes",
  col: 5,
  top: ROW1,
  number: "۶",
  title: "محدودیت کد ورود",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "perPhone", text: "هر شماره ساعتی چند بار کد بگیره" },
    { box: "perIp", text: "از هر اینترنت ساعتی چند بار" },
    { box: "fixed", text: "طول کد و زمانش ثابته، اینجا عوض نمی‌شه" },
  ],
});
nextArrow({ from: s5.shotX - 40, to: s6.right + 40, y: 300, label: "پایین‌تر" });

await write(process.argv[2]);
