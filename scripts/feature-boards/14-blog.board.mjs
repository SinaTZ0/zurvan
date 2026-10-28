// Builds the blog board (F16) from the shots 14-blog.capture.mjs recorded.
// Usage: node scripts/feature-boards/14-blog.board.mjs [out.excalidraw]
import { ADMIN, CALLOUT, ROW1, createBoard } from "./board-lib.mjs";

const { shots, header, step, text, arrow, nextArrow, write } = await createBoard({ name: "14-blog" });

/*===== Header =====*/
header({
  title: "وبلاگ: نوشته‌های طلا",
  summary:
    "همه نوشته‌ها رو با بخش و جست‌وجو می‌خونن؛ تو از پنل می‌نویسی، پیش‌نویس نگه می‌داری و با یه دکمه منتشر می‌کنی.",
  key: [
    { value: "قرمز: خواننده", color: CALLOUT },
    { value: "آبی: پنل مدیریت", color: ADMIN },
  ],
});

/*===== Row 1: reading =====*/
/*------ 1. The blog ------*/
const blog = shots["01-blog"].boxes;
const s1 = await step({
  name: "01-blog",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "صفحه‌ی وبلاگ",
  notes: [
    { box: "author", text: "نویسنده فقط خودتی؛ اسم و سابقه‌ت بالای صفحه‌ست" },
    {
      area: { x: 0, y: blog.sections.y, w: 390, h: blog.sections.h },
      text: "چهار بخش: رفتار، آموزش، نگهداری و سلامت، توله‌ها",
    },
    { box: "search", text: "جست‌وجو توی عنوان، خلاصه و متن" },
    { box: "lead", text: "تازه‌ترین نوشته بزرگ‌تر بالای همه‌ست" },
  ],
});

/*------ 2. A search typed with Arabic letters ------*/
const s2 = await step({
  name: "02-search",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "جست‌وجو با «ي» عربی",
  notes: [
    { box: "search", text: "اینجا با «ي» عربی تایپ شده" },
    { box: "count", text: "می‌گه چند تا نوشته پیدا کرد" },
    { box: "found", text: "باز هم پیداش می‌کنه؛ «ی»، «ک» و نیم‌فاصله فرقی نداره" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 470, label: "«ادرار هيجاني»" });

/*------ 3. Nothing found ------*/
const s3 = await step({
  name: "03-nothing",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "جست‌وجویی که چیزی پیدا نمی‌کنه",
  notes: [
    { box: "empty", text: "صاف می‌گه «چیزی پیدا نشد»" },
    {
      area: { x: 41, y: shots["03-nothing"].boxes.empty.y + 115, w: 308, h: 130 },
      text: "پاک کردن جست‌وجو، یا ارزیابی رایگان",
    },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 470, label: "«اسکیت‌برد»" });

/*------ 4. The end of an article ------*/
const end = shots["04-article-end"].boxes;
const s4 = await step({
  name: "04-article-end",
  col: 3,
  top: ROW1,
  number: "۴",
  title: "آخر یه نوشته",
  notes: [
    { box: "tip", text: "«سگ می‌گه»: نکته توی حباب حرف سگ" },
    { area: { x: 16, y: end.author.y - 205, w: 358, h: 260 }, text: "کارت خودت، با «بیشتر درباره‌ی طلا»" },
    { box: "closing", text: "دوره‌ای که خودت برای این نوشته انتخاب کردی" },
    { box: "course", text: "بدون دوره، اینجا دعوت به ارزیابی رایگان میاد" },
  ],
});
nextArrow({ from: s3.shotX - 40, to: s4.right + 40, y: 470, label: "یه نوشته رو باز کن" });

/*===== Row 2: writing (the Admin) =====*/
const ROW2 = Math.max(s1.bottom, s2.bottom, s3.bottom, s4.bottom) + 420;

/*------ 5. The text ------*/
const s5 = await step({
  name: "05-text",
  col: 0,
  top: ROW2,
  number: "۵",
  title: "پنل مدیریت: نوشته‌ی تازه",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "title", text: "عنوان" },
    { box: "excerpt", text: "خلاصه: برای انتشار ۴۰ تا ۳۰۰ حرف" },
    { box: "tip", text: "دکمه‌ی «سگ می‌گه» توی نوار ابزار متن" },
    { box: "heading", text: "تیتر بخش (H2)" },
    { box: "tipBlock", text: "نکته‌ی «سگ می‌گه» همین‌جا حباب می‌شه" },
  ],
});
// Row 2 starts under step 1, so the way down to it is a straight drop, labelled on its right.
const dropX = s1.shotX + 195;
arrow({
  points: [
    [dropX, s1.top + s1.height + 40],
    [dropX, ROW2 - 100],
  ],
  color: ADMIN,
  width: 8,
  head: "triangle",
});
text({
  right: s1.right,
  y: (s1.top + s1.height + ROW2) / 2 - 60,
  value: "پنل مدیریت ← وبلاگ ← «نوشته‌ی تازه»",
  size: 26,
  color: ADMIN,
  width: 300,
});

/*------ 6. The cover and the details ------*/
const s6 = await step({
  name: "06-cover",
  col: 1,
  top: ROW2,
  number: "۶",
  title: "عکس و جزئیات",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "cover", text: "عکس اصلی؛ برای انتشار لازمه" },
    { box: "alt", text: "توضیح عکس، یه جمله" },
    { box: "slug", text: "نشانی صفحه، با حروف انگلیسی" },
    { box: "category", text: "بخش نوشته" },
    { box: "course", text: "دوره‌ی آخر نوشته؛ «بدون دوره» یعنی ارزیابی رایگان" },
    { box: "draft", text: "«ذخیره‌ی پیش‌نویس»: هنوز کسی نمی‌بینه" },
  ],
});
nextArrow({ from: s5.shotX - 40, to: s6.right + 40, y: ROW2 + 1350, label: "پایین‌تر برو" });

/*------ 7. The list, with the draft ------*/
const s7 = await step({
  name: "07-list",
  col: 2,
  top: ROW2,
  number: "۷",
  title: "فهرست نوشته‌ها",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "newPost", text: "«نوشته‌ی تازه» از اینجاست" },
    { box: "tabs", text: "همه، پیش‌نویس‌ها، منتشرشده‌ها" },
    { box: "chip", text: "نوشته‌ی تازه پیش‌نویسه" },
    { box: "publish", text: "«انتشار» می‌زنی و می‌ره روی سایت" },
  ],
});
nextArrow({ from: s6.shotX - 40, to: s7.right + 40, y: ROW2 + 1150, label: "«ذخیره‌ی پیش‌نویس»" });

/*------ 8. On the public blog ------*/
const s8 = await step({
  name: "08-published",
  col: 3,
  top: ROW2,
  number: "۸",
  title: "روی وبلاگ",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "cover", text: "نوشته‌ی تازه اول همه، با عکسش" },
    { box: "section", text: "بخشی که انتخاب کردی" },
    { box: "lead", text: "بازش کن؛ نکته‌ت و ارزیابی رایگان آخرشه" },
  ],
});
nextArrow({ from: s7.shotX - 40, to: s8.right + 40, y: ROW2 + 700, label: "«انتشار»" });

await write(process.argv[2]);
