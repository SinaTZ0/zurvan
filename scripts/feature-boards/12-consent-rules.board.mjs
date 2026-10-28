// Builds the consent and site rules board (F13) from the shots 12-consent-rules.capture.mjs recorded: while the rules
// have no approved wording, there is no rules page, no link to it and no tick anywhere.
// Usage: node scripts/feature-boards/12-consent-rules.board.mjs [out.excalidraw]
import { ROW1, createBoard } from "./board-lib.mjs";

const { header, step, nextArrow, write } = await createBoard({ name: "12-consent-rules" });

/*===== Header =====*/
header({
  title: "قوانین سایت و رضایت",
  summary: "متن قوانین هنوز تأیید نشده، پس هیچ‌جا نیست: نه صفحه، نه لینک، نه تیک. متنش رو که بدی، روشن می‌شن.",
});

/*===== Row 1 =====*/
/*------ 1. The rules address ------*/
const s1 = await step({
  name: "01-rules-404",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "آدرس صفحه‌ی قوانین",
  notes: [
    { box: "header", text: "بالای سایت لینکی به قوانین نیست" },
    { box: "title", text: "آدرس قوانین «این صفحه اینجا نیست» می‌ده؛ درسته، متنش هنوز تأیید نشده" },
    { box: "home", text: "همون صفحه‌ای که هر آدرس اشتباهی می‌ده" },
  ],
});

/*------ 2. The footer ------*/
const s2 = await step({
  name: "02-footer",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "پایین هر صفحه",
  notes: [
    { box: "guide", text: "لینک «قوانین» اینجا نیست" },
    { box: "privacy", text: "فقط لینک حریم خصوصی هست" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 300, label: "پایین همون صفحه" });

/*------ 3. Sign-up's name step ------*/
const s3 = await step({
  name: "03-name",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "ثبت‌نام: قدم اسم",
  notes: [
    { box: "created", text: "مشتری تازه، بعد از کد پیامکی" },
    { box: "last", text: "فقط نام و نام خانوادگی؛ تیک قبول قوانین نداره" },
    { box: "next", text: "«ادامه» بدون هیچ تیکی" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 300, label: "«ورود یا ثبت‌نام»" });

/*------ 4. The cart ------*/
const s4 = await step({
  name: "04-cart",
  col: 3,
  top: ROW1,
  number: "۴",
  title: "سبد خرید",
  notes: [
    { box: "item", text: "یه دوره توی سبد" },
    { box: "summary", text: "جمع سبد" },
    { box: "pay", text: "بالای «پرداخت» تیک قوانین نیست؛ پرداخت مستقیم شروع می‌شه" },
  ],
});
nextArrow({ from: s3.shotX - 40, to: s4.right + 40, y: 300, label: "سگ، ارزیابی، «افزودن به سبد»" });

/*------ 5. The Privacy page ------*/
const s5 = await step({
  name: "05-privacy",
  col: 4,
  top: ROW1,
  number: "۵",
  title: "حریم خصوصی",
  notes: [
    { box: "title", text: "این صفحه منتشر شده؛ قوانین نیست" },
    { box: "kept", text: "چی نگه می‌داریم و کی چی رو می‌بینه؛ یه بار بخونش" },
  ],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: 300, label: "پایین صفحه: «حریم خصوصی»" });

await write(process.argv[2]);
