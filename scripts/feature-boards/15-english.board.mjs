// Builds the English site board (F15) from the shots 15-english.capture.mjs recorded.
// Usage: node scripts/feature-boards/15-english.board.mjs [out.excalidraw]
import { ADMIN, CALLOUT, ROW1, createBoard } from "./board-lib.mjs";

const { header, step, nextArrow, turnArrow, write } = await createBoard({ name: "15-english" });

/*===== Header =====*/
header({
  title: "نسخه‌ی انگلیسی سایت",
  summary: "همه‌ی صفحه‌ها جز پنل مدیریت انگلیسی هم دارن: عددها لاتین، قیمت به Toman. پنل مدیریت فارسی می‌مونه.",
  key: [
    { value: "قرمز: مشتری انگلیسی‌زبان", color: CALLOUT },
    { value: "آبی: پنل مدیریت", color: ADMIN },
  ],
});

/*===== Row 1: a visitor in English =====*/
/*------ 1. The home page ------*/
const s1 = await step({
  name: "01-home",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "صفحه‌ی اصلی انگلیسی",
  notes: [
    { box: "brand", text: "اسم انگلیسی: Zurvann" },
    { box: "hero", text: "همون صفحه‌ی اصلی، همه‌ش انگلیسی" },
    { box: "evaluation", text: "دکمه‌ی ارزیابی رایگان" },
    { box: "path", text: "پایین‌تر همون بخش‌های فارسی" },
  ],
});

/*------ 2. The course catalogue ------*/
const s2 = await step({
  name: "02-catalogue",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "دوره‌ها",
  notes: [
    { box: "title", text: "فهرست دوره‌ها" },
    { box: "families", text: "دسته‌ها هم انگلیسی‌ان" },
    { box: "sessions", text: "عددها لاتین" },
    { box: "price", text: "قیمت به Toman" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 600, label: "«Courses»" });

/*------ 3. A course page ------*/
const s3 = await step({
  name: "03-course",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "صفحه‌ی یه دوره",
  notes: [
    { box: "title", text: "اسم و توضیح دوره به انگلیسی" },
    { box: "facts", text: "جلسه‌ها، سن، جا و پیش‌نیاز" },
    { box: "price", text: "قیمت کامل: 4,500,000 Toman" },
    { box: "add", text: "«Sign in and add to cart»" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 600, label: "«House Dog»" });

/*------ 4. Signing in in English ------*/
const s4 = await step({
  name: "04-sign-in",
  col: 3,
  top: ROW1,
  number: "۴",
  title: "ورود به انگلیسی",
  notes: [
    { box: "title", text: "صفحه‌ی ورود هم انگلیسیه" },
    { box: "sent", text: "شماره با عدد لاتین" },
    { box: "code", text: "کد پیامک؛ خود پیامک فارسی می‌مونه" },
  ],
});
nextArrow({ from: s3.shotX - 40, to: s4.right + 40, y: 400, label: "«Sign in and add to cart»" });

/*------ 5. Back on the course, still in English ------*/
const s5 = await step({
  name: "05-back",
  col: 4,
  top: ROW1,
  number: "۵",
  title: "برگشت به همون دوره",
  notes: [
    { box: "cart", text: "حالا وارد شده؛ سبد خرید اومد" },
    { box: "title", text: "بعد از ورود هنوز انگلیسیه" },
    { box: "addDog", text: "مشتری تازه اول سگش رو معرفی می‌کنه" },
  ],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: 400, label: "کد و اسم" });

/*------ 6. The account in English ------*/
const s6 = await step({
  name: "06-account",
  col: 5,
  top: ROW1,
  number: "۶",
  title: "حساب مشتری",
  notes: [
    { box: "hello", text: "سگ زروان به انگلیسی سلام می‌کنه" },
    { box: "greeting", text: "«My dogs»: سگ‌های من" },
    { box: "add", text: "«Add a dog»: معرفی سگ" },
  ],
});
nextArrow({ from: s5.shotX - 40, to: s6.right + 40, y: 400, label: "حساب" });

/*===== Row 2: the Admin =====*/
const ROW2 = Math.max(s1.bottom, s2.bottom, s3.bottom, s4.bottom, s5.bottom, s6.bottom) + 420;

/*------ 7. The Admin stays Persian ------*/
const s7 = await step({
  name: "07-admin",
  col: 6,
  top: ROW2,
  number: "۷",
  title: "پنل مدیریت فارسی می‌مونه",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "header", text: "نشونی انگلیسی پنل رو باز کن؛ برمی‌گرده به فارسی" },
    { box: "heading", text: "پنل فقط فارسیه" },
    { box: "waiting", text: "عددها هم فارسی" },
  ],
});
turnArrow({ from: s6, to: s7, label: "پنل مدیریت از سایت انگلیسی", color: ADMIN });

await write(process.argv[2]);
