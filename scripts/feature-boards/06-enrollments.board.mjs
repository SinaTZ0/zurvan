// Builds the enrollments board (F6) from the shots 06-enrollments.capture.mjs recorded.
// Usage: node scripts/feature-boards/06-enrollments.board.mjs [out.excalidraw]
import { ADMIN, CALLOUT, ROW1, createBoard } from "./board-lib.mjs";

const { shots, header, step, nextArrow, turnArrow, write } = await createBoard({ name: "06-enrollments" });

/*===== Header =====*/
header({
  title: "ثبت‌نام‌ها: تمام شد و لغو",
  summary: "آموزش که تموم شد «تمام شد» می‌زنی؛ دوره گذرونده می‌شه و دوره‌ی بعدیِ سگ باز می‌شه. «لغو» هم هست.",
  key: [
    { value: "آبی: پنل مدیریت", color: ADMIN },
    { value: "قرمز: مشتری", color: CALLOUT },
  ],
});

/*===== Row 1: the Admin ends the enrollments =====*/
/*------ 1. Two enrollments in training ------*/
const s1 = await step({
  name: "01-admin-active",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "پنل: ثبت‌نام‌ها",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "tabs", text: "اینجا آموزش‌های در جریان رو می‌بینی" },
    { box: "call", text: "مشتری و شماره‌ش؛ بزنی زنگ می‌زنه" },
    { box: "companion", text: "هر دوره: سگ، جای آموزش، قیمت و تاریخ خرید" },
    { box: "house", text: "زیر هر کدوم «تمام شد» و «لغو»" },
  ],
});

/*------ 2. «تمام شد», asked once ------*/
const s2 = await step({
  name: "02-finish",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "سگ همدم ۱ تمام شد؟",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "question", text: "یه بار می‌پرسه؛ برگشت نداره" },
    { box: "yes", text: "دوره گذرونده حساب می‌شه، دوره‌های بعدی باز می‌شن و به صاحبش پیامک می‌ره" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 300, label: "سگ همدم ۱: «تمام شد»", color: ADMIN });

/*------ 3. «لغو», asked once ------*/
const s3 = await step({
  name: "03-cancel",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "لغو سگ خونگی",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "question", text: "لغو هم یه بار می‌پرسه" },
    { box: "body", text: "پول خودکار برنمی‌گرده؛ اگه پس دادی، توی پرداخت‌ها ثبتش کن" },
    { box: "yes", text: "«لغو کن»" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 640, label: "سگ خونگی: «لغو»", color: ADMIN });

/*------ 4. Both ended, under «همه» ------*/
const s4 = await step({
  name: "04-admin-ended",
  col: 3,
  top: ROW1,
  number: "۴",
  title: "زیر «همه»",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "companion", text: "سگ همدم ۱: «تمام شد»" },
    { box: "house", text: "سگ خونگی: «لغو شد»" },
  ],
});
nextArrow({ from: s3.shotX - 40, to: s4.right + 40, y: 640, label: "«همه»", color: ADMIN });

/*===== Row 2: what the customer sees =====*/
const ROW2 = Math.max(s1.bottom, s2.bottom, s3.bottom, s4.bottom) + 420;

/*------ 5. «سگ‌های من» ------*/
const s5 = await step({
  name: "05-account",
  col: 4,
  top: ROW2,
  number: "۵",
  title: "سگ‌های من",
  notes: [
    // The whole stats row: an arrow to its far (left) cell would cross the others.
    { area: { ...shots["05-account"].boxes.stats, x: 17, w: 356 }, text: "یه دوره‌ی گذرونده" },
    { box: "passed", text: "توی مسیر سگ: گذرونده، سگ همدم ۱" },
  ],
});
turnArrow({ from: s4, to: s5, label: "مشتری می‌بینه", color: CALLOUT });

/*------ 6. The dog's page ------*/
const s6 = await step({
  name: "06-dog",
  col: 5,
  top: ROW2,
  number: "۶",
  title: "صفحه‌ی شاهین",
  notes: [
    { area: { ...shots["06-dog"].boxes.stats, x: 17, w: 356 }, text: "دوره‌ی گذرونده: ۱" },
    { box: "completed", text: "سگ همدم ۱: «تمام شد»، با تاریخ" },
    { box: "cancelled", text: "سگ خونگی: «لغو شد»" },
  ],
});
nextArrow({ from: s5.shotX - 40, to: s6.right + 40, y: ROW2 + 300, label: "«همه‌ی سابقه‌ی شاهین»" });

/*------ 7. The next course opens ------*/
const s7 = await step({
  name: "07-buy-next",
  col: 6,
  top: ROW2,
  number: "۷",
  title: "دوره‌ی بعدی باز شد",
  notes: [
    { box: "count", text: "حالا ۶ تا دوره می‌تونه برداره" },
    { box: "house", text: "سگ خونگیِ لغوشده دوباره قابل خریده" },
    { box: "companion2", text: "سگ همدم ۲ باز شد، چون پیش‌نیازش تموم شده" },
  ],
});
nextArrow({ from: s6.shotX - 40, to: s7.right + 40, y: ROW2 + 300, label: "«خرید دوره»" });

await write(process.argv[2]);
