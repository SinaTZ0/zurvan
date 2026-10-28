// Builds the courses and eligibility board (F8, F4) from the shots 04-courses-eligibility.capture.mjs recorded.
// Usage: node scripts/feature-boards/04-courses-eligibility.board.mjs [out.excalidraw]
import { CALLOUT, RETURNING, ROW1, createBoard } from "./board-lib.mjs";

const { shots, header, step, nextArrow, turnArrow, write } = await createBoard({ name: "04-courses-eligibility" });

/** One box around two recorded boxes (e.g. the first and last chip of a row). */
const around = (a, b) => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

/*===== Header =====*/
header({
  title: "دوره‌ها و اینکه کدوم سگ می‌تونه برداره",
  summary: "هر دوره جلسه، سن، جای آموزش و پیش‌نیازش رو می‌گه؛ برای هر سگ مشتری می‌گه می‌تونه برداره یا چرا نه.",
  key: [
    { value: "قرمز: از صفحه‌ی دوره", color: CALLOUT },
    { value: "سبز: «خرید دوره»، از روی سگ", color: RETURNING },
  ],
});

/*===== Row 1: from a course's page =====*/
/*------ 1. The catalogue ------*/
const catalogue = shots["01-catalogue"].boxes;
const s1 = await step({
  name: "01-catalogue",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "فهرست دوره‌ها",
  notes: [
    { box: "buy", text: "«خرید دوره»: خرید رو از روی سگ شروع می‌کنه (ردیف پایین)" },
    { area: around(catalogue.chipsFrom, catalogue.chipsTo), text: "دسته‌ها؛ بزنی می‌ره سراغش" },
    { box: "family", text: "هر دسته با یه توضیح کوتاه" },
    { box: "card", text: "هر دوره: چند جلسه و چه قیمتی" },
  ],
});

/*------ 2. A course's settings ------*/
const course = shots["02-course"].boxes;
const s2 = await step({
  name: "02-course",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "صفحه‌ی دوره: سگ همدم ۲",
  notes: [
    // Each row of the settings grid as one: a note to its far (left) cell would cross the near one.
    { area: around(course.sessions, course.age), text: "طول دوره (حدوداً چند جلسه) و از چند ماهگی" },
    {
      area: around(course.place, course.prerequisite),
      text: "جاهایی که توی پنل تیک زدی، و پیش‌نیاز: سگ همدم ۱. امتحان کن: یه جا رو پیشنهادی کنی، اینجا «پیشنهاد طلا» می‌آد",
    },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 200, label: "«سگ همدم ۲»" });

/*------ 3. A dog that isn't evaluated ------*/
const s3 = await step({
  name: "03-not-evaluated",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "سگی که ارزیابی نشده",
  notes: [
    { box: "dog", text: "نازی رو انتخاب می‌کنه" },
    { box: "add", text: "«افزودن به سبد» خاموشه" },
    { box: "reason", text: "چون هنوز ارزیابی نشده؛ لینک ارزیابی رایگان همون‌جاست" },
    { box: "prerequisite", text: "پیش‌نیاز رو هم جدا می‌گه" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 120, label: "«برای کدوم سگ؟»" });

/*------ 4. A prerequisite not passed ------*/
const s4 = await step({
  name: "04-prerequisite",
  col: 3,
  top: ROW1,
  number: "۴",
  title: "پیش‌نیاز رو نگذرونده",
  notes: [
    { box: "dog", text: "رستم ارزیابی شده" },
    { box: "reason", text: "ولی اول باید سگ همدم ۱ رو تموم کنه؛ «این دوره رو ببین» می‌بره سراغش" },
  ],
});
nextArrow({ from: s3.shotX - 40, to: s4.right + 40, y: 120, label: "«رستم»" });

/*------ 5. Too old ------*/
const s5 = await step({
  name: "05-age",
  col: 4,
  top: ROW1,
  number: "۵",
  title: "سنش نمی‌خوره",
  notes: [
    // The whole row, so the arrow doesn't cross the sessions cell.
    { area: { ...shots["05-age"].boxes.age, x: 16, w: 358 }, text: "این دوره فقط ۶ تا ۷ ماهگیه" },
    { box: "place", text: "جای آموزش هر دوره خودشه: اینجا بیرون و پانسیون" },
    { box: "dog", text: "رستم یه سال و دو ماهشه" },
    { box: "reason", text: "«حداکثر سن این دوره ۷ ماهه»" },
  ],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: 120, label: "«مخصوص سگ‌های شش‌ماهه»" });

/*===== Row 2: «خرید دوره», from the dog =====*/
const ROW2 = Math.max(s1.bottom, s2.bottom, s3.bottom, s4.bottom, s5.bottom) + 420;

/*------ 6. Which dog? ------*/
const s6 = await step({
  name: "06-buy-pick",
  col: 1,
  top: ROW2,
  number: "۶",
  title: "خرید دوره: برای کدوم سگ؟",
  color: RETURNING,
  titleColor: RETURNING,
  notes: [
    { box: "title", text: "اول می‌پرسه برای کدوم سگ" },
    { box: "rostam", text: "با یه بار زدن انتخاب می‌شه؛ سگ تازه هم همین‌جا معرفی می‌شه" },
  ],
});
turnArrow({ from: s1, to: s6, label: "«خرید دوره»", color: RETURNING });

/*------ 7. What the dog can take now ------*/
const s7 = await step({
  name: "07-buy-open",
  col: 2,
  top: ROW2,
  number: "۷",
  title: "رستم الان چی می‌تونه برداره",
  color: RETURNING,
  titleColor: RETURNING,
  notes: [
    { box: "dog", text: "سگ انتخاب‌شده" },
    { box: "open", text: "اینا همین الان بازن، با قیمتشون" },
    { box: "first", text: "هر کدوم «افزودن به سبد» داره" },
    { box: "companion", text: "سگ همدم ۱ هم اینجاست؛ قدم اول مسیر همدم" },
  ],
});
nextArrow({ from: s6.shotX - 40, to: s7.right + 40, y: ROW2 + 300, label: "«رستم»", color: RETURNING });

/*------ 8. What opens later, and why ------*/
const s8 = await step({
  name: "08-buy-later",
  col: 3,
  top: ROW2,
  number: "۸",
  title: "بعداً باز می‌شن، با دلیلش",
  color: RETURNING,
  titleColor: RETURNING,
  notes: [
    { box: "bmc", text: "سن: حداکثر ۷ ماه" },
    { box: "companion2", text: "پیش‌نیاز: اول سگ همدم ۱" },
    { box: "working", text: "سگ‌های کار و ورزشی فعلاً فروخته نمی‌شن" },
  ],
});
nextArrow({ from: s7.shotX - 40, to: s8.right + 40, y: ROW2 + 300, label: "پایین‌تر", color: RETURNING });

await write(process.argv[2]);
