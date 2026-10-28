// Builds the dog profile board (F2) from the shots 02-dog-profile.capture.mjs recorded.
// Usage: node scripts/feature-boards/02-dog-profile.board.mjs [out.excalidraw]
import { ADMIN, RETURNING, ROW1, createBoard } from "./board-lib.mjs";

const { shots, header, step, nextArrow, turnArrow, write } = await createBoard({ name: "02-dog-profile" });

/*===== Header =====*/
header({
  title: "معرفی سگ و پرونده‌ش",
  summary: "مشتری سگش رو در چهار قدم معرفی می‌کنه؛ فقط دو قدم اول لازمه. بعد از ارزیابی نژاد و تولدش قفل می‌شه.",
  key: [
    { value: "سبز: سگی که ارزیابی شده", color: RETURNING },
    { value: "آبی: پنل مدیریت", color: ADMIN },
  ],
});

/*===== Row 1: a new customer's first dog =====*/
/*------ 1. No dogs yet ------*/
const s1 = await step({
  name: "01-no-dogs",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "سگ‌های من (خالی)",
  notes: [
    { box: "empty", text: "مشتری تازه هنوز سگی نداره" },
    { box: "add", text: "«معرفی سگ»" },
  ],
});

/*------ 2. Who it is ------*/
const identity = shots["02-identity"].boxes;
const s2 = await step({
  name: "02-identity",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "قدم اول: شناسنامه",
  notes: [
    // The dog tag above the stepper, measured from its «حذف عکس» link.
    { area: { x: 16, y: identity.remove.y - 150, w: 358, h: 235 }, text: "کارتش همون موقع پر می‌شه؛ عکس اختیاریه" },
    { box: "steps", text: "چهار قدم؛ فقط دو تای اول لازمه" },
    // The whole row: «حدوداً», the years and the months.
    { area: { ...identity.age, x: 37, w: 316 }, text: "تاریخ تولد دقیق، یا سن حدودی" },
    { box: "purity", text: "نوع نژاد: خالص، دورگه یا میکس" },
    {
      area: {
        x: identity.breeds.x,
        y: identity.breeds.y,
        w: identity.breed.x + identity.breed.w - identity.breeds.x,
        h: identity.breed.h,
      },
      text: "دورگه: نژاد پدر و مادر رو می‌پرسه",
    },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 420, label: "«معرفی سگ»" });

/*------ 3. Body ------*/
const s3 = await step({
  name: "03-body",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "قدم دوم: بدن",
  notes: [
    { box: "weight", text: "وزن لازمه؛ تقریبی هم قبوله" },
    { box: "neutered", text: "عقیم شده یا نه؛ اینم لازمه" },
    { box: "optional", text: "قد، رنگ و علائم اختیاریه" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 1100, label: "«بعدی»" });

/*------ 4. Health (optional) ------*/
const s4 = await step({
  name: "04-health",
  col: 3,
  top: ROW1,
  number: "۴",
  title: "قدم سوم: سلامت",
  notes: [
    { box: "vaccines", text: "واکسن‌ها: کامل، ناقص یا نمی‌دونم" },
    { box: "card", text: "عکس کارت واکسن، تا ۶ تا" },
    { box: "microchip", text: "میکروچیپ، تاریخ کاشتش و عکس تتو" },
    { box: "medical", text: "بیماری‌ها و عکس مدارک دامپزشک" },
    { box: "later", text: "این قدم اختیاریه؛ «بعداً» ردش می‌کنه" },
  ],
});
nextArrow({ from: s3.shotX - 40, to: s4.right + 40, y: 1000, label: "«بعدی»" });

/*------ 5. Training (optional) ------*/
const s5 = await step({
  name: "05-training",
  col: 4,
  top: ROW1,
  number: "۵",
  title: "قدم چهارم: آموزش",
  notes: [
    { box: "goals", text: "هدف آموزش؛ چند تا با هم می‌شه" },
    { box: "problems", text: "مشکلات رفتاری، هر کدوم یه خط" },
    { box: "submit", text: "«اضافه کن»" },
  ],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: 400, label: "«بعدی»" });

/*------ 6. Back on «سگ‌های من» ------*/
const s6 = await step({
  name: "06-dogs",
  col: 5,
  top: ROW1,
  number: "۶",
  title: "سگ تازه توی حسابش",
  notes: [
    { box: "toast", text: "«شیرو اضافه شد»" },
    { box: "badge", text: "هنوز ارزیابی نشده" },
    { box: "line", text: "خلاصه: جنس، سن و وزن" },
    { box: "evaluation", text: "قدم بعد: ارزیابی رایگان" },
  ],
});
nextArrow({ from: s5.shotX - 40, to: s6.right + 40, y: 400, label: "«اضافه کن»" });

/*===== Row 2 =====*/
const ROW2 = Math.max(s1.bottom, s2.bottom, s3.bottom, s4.bottom, s5.bottom, s6.bottom) + 420;

/*------ 7. An evaluated dog: the locked fields ------*/
const locked = shots["07-locked"].boxes;
const s7 = await step({
  name: "07-locked",
  col: 2,
  top: ROW2,
  number: "۷",
  title: "ویرایش سگی که ارزیابی شده",
  color: RETURNING,
  titleColor: RETURNING,
  notes: [
    { box: "name", text: "اسم و بقیه‌ی چیزها رو هنوز عوض می‌کنه" },
    // From under the sex choice down to the lock note: breed type, breed and birth date.
    {
      area: { x: 37, y: locked.name.y + 185, w: 316, h: locked.locked.y - locked.name.y - 195 },
      text: "نوع نژاد، نژاد و تولد قفله",
    },
    { box: "locked", text: "از اینجا به بعد فقط خودت از پنل عوضشون می‌کنی" },
  ],
});
turnArrow({ from: s2, to: s7, label: "بعد از ارزیابی", color: RETURNING });

/*------ 8. The Admin's view ------*/
const s8 = await step({
  name: "08-admin-dog",
  col: 6,
  top: ROW2,
  number: "۸",
  title: "پنل مدیریت: صفحه‌ی سگ",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "heading", text: "سگ تازه با همه‌ی مشخصاتش" },
    { box: "edit", text: "ویرایش همه‌چیز، حتی بعد از ارزیابی" },
    { box: "owner", text: "صاحبش و شماره‌ش" },
    { box: "evaluate", text: "سگی که می‌شناسی رو همین‌جا «ارزیابی شد» می‌زنی" },
    { box: "courses", text: "دوره‌ها تا ارزیابی بسته‌ن" },
    { box: "problems", text: "مشکلات رفتاری که صاحبش نوشته" },
  ],
});
turnArrow({ from: s6, to: s8, label: "پنل مدیریت", color: ADMIN });

await write(process.argv[2]);
