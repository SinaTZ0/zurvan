// Builds the free evaluation board (F3) from the shots 03-evaluation.capture.mjs recorded.
// Usage: node scripts/feature-boards/03-evaluation.board.mjs [out.excalidraw]
import { ADMIN, RETURNING, ROW1, createBoard } from "./board-lib.mjs";

const { shots, header, step, nextArrow, turnArrow, write } = await createBoard({ name: "03-evaluation" });

/** One box around two recorded boxes (e.g. the first and last of a row of fields). */
const around = (a, b) => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

/** A badge with the dog's name on its right, up to the card's edge (so the arrow doesn't cross the name). */
const withName = (badge) => ({ x: badge.x, y: badge.y - 6, w: 374 - badge.x, h: badge.h + 12 });

/*===== Header =====*/
header({
  title: "ارزیابی رایگان",
  summary:
    "مشتری برای سگش ارزیابی رایگان می‌خواد؛ تو بعد از دیدنش «ارزیابی شد» یا «رد» می‌زنی و مشتری جوابت رو می‌بینه.",
  key: [
    { value: "قرمز: مشتری", color: "#e03131" },
    { value: "آبی: پنل مدیریت", color: ADMIN },
    { value: "سبز: مشتری بعد از جوابت", color: RETURNING },
  ],
});

/*===== Row 1: the customer asks =====*/
/*------ 1. The request form ------*/
const request = shots["01-request"].boxes;
const s1 = await step({
  name: "01-request",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "فرم ارزیابی رایگان",
  notes: [
    { box: "dog", text: "اول سگ رو انتخاب می‌کنه؛ هر سگ یه ارزیابی رایگان داره" },
    { area: around(request.dateFrom, request.dateTo), text: "از چه روزی آزاده" },
    { area: around(request.days, request.periods), text: "روزها و ساعت‌هایی که معمولاً آزاده؛ چند تا هم می‌شه" },
    { box: "files", text: "عکس و فیلم اختیاریه و آخر فرمه" },
    { box: "submit", text: "«درخواست ارزیابی رایگان»" },
  ],
});

/*------ 2. The receipt ------*/
const s2 = await step({
  name: "02-receipt",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "درخواستت رسید",
  notes: [
    { box: "title", text: "همون لحظه رسیدش رو می‌بینه" },
    // The whole road of four stops, the call now the current one.
    { area: { x: 16, y: shots["02-receipt"].boxes.road.y - 34, w: 358, h: 56 }, text: "حالا نوبت زنگ توئه" },
    { box: "receipt", text: "هر چی فرستاده، یه جا" },
    { box: "another", text: "سگ دیگه هم داره؟ از همین‌جا" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 420, label: "«درخواست ارزیابی رایگان»" });

/*------ 3. Waiting on «سگ‌های من» ------*/
const s3 = await step({
  name: "03-waiting",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "سگ‌های من: منتظر زنگ",
  notes: [
    { area: withName(shots["03-waiting"].boxes.badge), text: "برچسب «در انتظار ارزیابی»" },
    { box: "withdraw", text: "تا جواب ندادی، می‌تونه درخواستش رو پس بگیره" },
    { box: "timeline", text: "توی مسیر سگ: منتظر زنگ طلا" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 420, label: "«برو به سگ‌های من»" });

/*===== Row 2: the Admin answers =====*/
const ROW2 = Math.max(s1.bottom, s2.bottom, s3.bottom) + 420;

/*------ 4. The waiting requests ------*/
const s4 = await step({
  name: "04-admin-list",
  col: 3,
  top: ROW2,
  number: "۴",
  title: "پنل: ارزیابی‌ها",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "tabs", text: "اینجا درخواست‌های منتظر جوابت رو می‌بینی" },
    { box: "fandogh", text: "هر ردیف: سگ، صاحبش، شماره‌ش و عکس‌ها" },
    { box: "tara", text: "روی درخواست تارا بزن" },
  ],
});
turnArrow({ from: s3, to: s4, label: "پنل مدیریت", color: ADMIN });

/*------ 5. A request in its drawer ------*/
const s5 = await step({
  name: "05-drawer",
  col: 4,
  top: ROW2,
  number: "۵",
  title: "درخواست تارا",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "call", text: "صاحبش؛ شماره رو بزنی زنگ می‌زنه" },
    { box: "when", text: "کی آزاده: از چه روزی، چه روزها و ساعت‌هایی" },
    { box: "photos", text: "عکس‌هاش؛ بزنی بزرگ می‌شه" },
    { box: "evaluate", text: "بعد از دیدن سگ: «ارزیابی شد»" },
  ],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: ROW2 + 300, label: "درخواست تارا", color: ADMIN });

/*------ 6. «ارزیابی شد», asked once ------*/
const s6 = await step({
  name: "06-evaluate",
  col: 5,
  top: ROW2,
  number: "۶",
  title: "یه بار دیگه می‌پرسه",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "question", text: "برگشت نداره، برای همین یه بار می‌پرسه" },
    { box: "yes", text: "دوره‌هاش باز می‌شه و به صاحبش پیامک می‌ره" },
  ],
});
nextArrow({ from: s5.shotX - 40, to: s6.right + 40, y: ROW2 + 300, label: "«ارزیابی شد»", color: ADMIN });

/*------ 7. «رد» with a reason ------*/
const s7 = await step({
  name: "07-reject",
  col: 6,
  top: ROW2,
  number: "۷",
  title: "«رد» برای فندق",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "question", text: "سگ دیگه‌ای که نشد ببینیش، یا به درد آموزش نمی‌خوره" },
    { box: "reason", text: "دلیلش لازمه؛ توی پیامک به صاحبش می‌رسه" },
    { box: "yes", text: "«رد کن»" },
  ],
});
nextArrow({ from: s6.shotX - 40, to: s7.right + 40, y: ROW2 + 300, label: "فندق: «رد»", color: ADMIN });

/*------ 8. What the customer sees ------*/
const answers = shots["08-answers"].boxes;
const s8 = await step({
  name: "08-answers",
  col: 7,
  top: ROW2,
  number: "۸",
  title: "مشتری جوابت رو می‌بینه",
  color: RETURNING,
  titleColor: RETURNING,
  notes: [
    { area: withName(answers.rejected), text: "فندق: «رد شد»" },
    // The reason's box under the dog's line, measured from its «دلیل:».
    { area: { x: 16, y: answers.reason.y - 14, w: 358, h: 60 }, text: "دلیلت رو همین‌جا می‌خونه" },
    { box: "again", text: "«ارزیابی دوباره»: سگ ردشده دوباره می‌تونه درخواست بده" },
    { area: withName(answers.evaluated), text: "تارا: «ارزیابی شد»" },
    { box: "courses", text: "حالا دوره‌هاش بازه" },
  ],
});
nextArrow({ from: s7.shotX - 40, to: s8.right + 40, y: ROW2 + 300, label: "مشتری می‌بینه", color: RETURNING });

await write(process.argv[2]);
