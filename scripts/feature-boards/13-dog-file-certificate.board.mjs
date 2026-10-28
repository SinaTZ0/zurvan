// Builds the dog file, logbook and certificate board (F14) from the shots 13-dog-file-certificate.capture.mjs recorded.
// Usage: node scripts/feature-boards/13-dog-file-certificate.board.mjs [out.excalidraw]
import { ADMIN, CALLOUT, ROW1, createBoard } from "./board-lib.mjs";

const { shots, header, step, nextArrow, turnArrow, write } = await createBoard({ name: "13-dog-file-certificate" });

/*===== Header =====*/
header({
  title: "پرونده، دفترچه و گواهی سگ",
  summary: "هر سگ شماره‌ی پرونده و QR داره و پرونده‌ش خصوصیه. تو جلسه می‌نویسی و گواهی صادر می‌کنی.",
  key: [
    { value: "قرمز: صاحب سگ و بقیه", color: CALLOUT },
    { value: "آبی: پنل مدیریت", color: ADMIN },
  ],
});

/*===== Row 1: the owner, then anyone else =====*/
/*------ 1. The file card ------*/
const file = shots["01-file"].boxes;
const s1 = await step({
  name: "01-file",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "پرونده‌ی سگ، صفحه‌ی صاحبش",
  notes: [
    // The top of the card: the QR code, the number and the line under it.
    {
      area: { x: 37, y: file.number.y - 25, w: 316, h: file.note.y + file.note.h - file.number.y + 25 },
      text: "شماره‌ی پرونده (با ZD) و QR‌ش؛ هیچ‌وقت عوض نمی‌شه",
    },
    { box: "copy", text: "لینکش رو کپی می‌کنه" },
    { box: "download", text: "QR رو برای چاپ دانلود می‌کنه؛ توی پنل هم پایین صفحه‌ی سگ همین کارت هست" },
  ],
});

/*------ 2. The certificate and the logbook ------*/
const s2 = await step({
  name: "02-certificate-logbook",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "گواهی و دفترچه، صفحه‌ی صاحبش",
  notes: [
    { box: "certificate", text: "گواهی دوره‌ای که تموم شد، «معتبر»" },
    { box: "certificateNumber", text: "شماره‌ی گواهی با ZC شروع می‌شه" },
    { box: "copy", text: "لینک بررسی گواهی؛ QR بالاش هم همونه" },
    { box: "session", text: "جلسه‌ای که تو نوشتی (قدم ۷)؛ جدیدترین بالاست" },
    { box: "exercises", text: "تمرین‌ها هر کدوم جدا" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 300, label: "همون صفحه، بالاتر" });

/*------ 3. The lookup ------*/
const s3 = await step({
  name: "03-lookup",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "لاگ‌بوک: باز کردن با شماره",
  notes: [
    { box: "title", text: "از پایین سایت، «لاگ‌بوک سگ‌ها»" },
    { box: "field", text: "شماره رو با حروف کوچیک و بدون ZD هم بزنی پیدا می‌کنه" },
    { box: "open", text: "«باز کن»" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 300, label: "یه غریبه: «لاگ‌بوک سگ‌ها»" });

/*------ 4. What a stranger sees ------*/
const s4 = await step({
  name: "04-private",
  col: 3,
  top: ROW1,
  number: "۴",
  title: "کسی که صاحبش نیست",
  notes: [
    { box: "title", text: "فقط «این پرونده خصوصیه»؛ نه اسم سگ، نه هیچی" },
    { box: "signIn", text: "صاحبش وارد بشه، QR مستقیم می‌برش صفحه‌ی سگش؛ تو رو به پنل" },
    { box: "other", text: "یه شماره‌ی الکی هم بزن: همین صفحه رو می‌بینی" },
  ],
});
nextArrow({ from: s3.shotX - 40, to: s4.right + 40, y: 300, label: "«باز کن»" });

/*------ 5. The certificate checks out ------*/
const s5 = await step({
  name: "05-valid",
  col: 4,
  top: ROW1,
  number: "۵",
  title: "بررسی گواهی",
  notes: [
    { box: "title", text: "با QR یا لینک گواهی، هر کسی می‌بینه معتبره" },
    { box: "course", text: "اسم دوره و روز صدور" },
    { box: "issuer", text: "صادرکننده: خودت" },
    { box: "number", text: "اسم صاحب و سگ هیچ‌جا نمیاد" },
  ],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: 300, label: "QR گواهی" });

/*------ 6. Revoked ------*/
const s6 = await step({
  name: "06-revoked",
  col: 5,
  top: ROW1,
  number: "۶",
  title: "گواهی باطل‌شده",
  notes: [
    { box: "title", text: "بعد از باطل کردن (قدم ۹) همون لینک اینو نشون می‌ده" },
    { box: "when", text: "فقط شماره و روز باطل شدن؛ دلیلش رو کسی نمی‌بینه" },
  ],
});
nextArrow({ from: s5.shotX - 40, to: s6.right + 40, y: 300, label: "بعد از باطل کردن" });

/*===== Row 2: the Admin =====*/
const ROW2 = Math.max(s1.bottom, s2.bottom, s3.bottom, s4.bottom, s5.bottom, s6.bottom) + 420;

/*------ 7. A session ------*/
const s7 = await step({
  name: "07-session",
  col: 1,
  top: ROW2,
  number: "۷",
  title: "پنل: ثبت جلسه",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "day", text: "روز جلسه؛ روز آینده رو قبول نمی‌کنه" },
    { box: "course", text: "یکی از دوره‌های خود سگ، یا بدون دوره" },
    { box: "notes", text: "چی کار کردید؛ فقط صاحبش و تو می‌بینید" },
    { box: "exercises", text: "هر تمرین یه خط" },
    { box: "save", text: "«ذخیره»؛ بعداً درستش می‌کنی ولی پاک نمی‌شه" },
  ],
});
turnArrow({ from: s1, to: s7, label: "پنل مدیریت: صفحه‌ی سگ، «ثبت جلسه»", color: ADMIN });

/*------ 8. Issuing the certificate ------*/
const s8 = await step({
  name: "08-issue",
  col: 2,
  top: ROW2,
  number: "۸",
  title: "پنل: صدور گواهی",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "course", text: "دوره‌ای که «تمام شد» زدی اینجا میاد" },
    { box: "issue", text: "«صدور گواهی»؛ یه بار دیگه ازت می‌پرسه" },
    { box: "add", text: "«ثبت جلسه» همین‌جاست" },
    { box: "session", text: "جلسه‌ی ثبت‌شده؛ بزنی روش ویرایش می‌شه" },
  ],
});
nextArrow({ from: s7.shotX - 40, to: s8.right + 40, y: ROW2 + 300, label: "«ذخیره»", color: ADMIN });

/*------ 9. Revoking it ------*/
const s9 = await step({
  name: "09-revoke",
  col: 3,
  top: ROW2,
  number: "۹",
  title: "پنل: باطل کردن گواهی",
  color: ADMIN,
  titleColor: ADMIN,
  notes: [
    { box: "title", text: "اشتباه صادر شد؟ «باطل کردن» کنار شماره‌ش" },
    { box: "reason", text: "دلیل لازمه؛ فقط خودت می‌بینیش" },
    { box: "confirm", text: "«باطل کن»؛ برگشت نداره و دوباره صادر نمی‌شه" },
  ],
});
nextArrow({ from: s8.shotX - 40, to: s9.right + 40, y: ROW2 + 300, label: "«باطل کردن»", color: ADMIN });

await write(process.argv[2]);
