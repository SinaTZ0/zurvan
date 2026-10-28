// Builds the privacy board (F12, the part that shows) from the shots 11-privacy.capture.mjs recorded: a customer can't
// see another's dog or the panel, and a partner sees his own people without prices, dogs or other partners.
// Usage: node scripts/feature-boards/11-privacy.board.mjs [out.excalidraw]
import { RETURNING, ROW1, createBoard } from "./board-lib.mjs";

const { header, step, nextArrow, turnArrow, write } = await createBoard({ name: "11-privacy" });

/*===== Header =====*/
header({
  title: "حریم خصوصی: کی چی رو نمی‌بینه",
  summary: "هر مشتری فقط سگ‌های خودش رو می‌بینه؛ همکار فقط آدم‌های خودش رو، بدون قیمت و سگ.",
  key: [{ value: "سبز: حساب همکار", color: RETURNING }],
});

/*===== Row 1: customers =====*/
/*------ 1. Sara's own dog ------*/
const s1 = await step({
  name: "01-own-dog",
  col: 0,
  top: ROW1,
  number: "۱",
  title: "سارا: سگ خودش",
  notes: [
    { box: "account", text: "با حساب سارا، مشتری نمونه" },
    { box: "name", text: "لئو، سگ خود سارا؛ آدرس این صفحه رو کپی کن" },
  ],
});

/*------ 2. Another customer, the same address ------*/
const s2 = await step({
  name: "02-not-found",
  col: 1,
  top: ROW1,
  number: "۲",
  title: "یه مشتری دیگه، همون آدرس",
  notes: [
    { box: "account", text: "با یه حساب دیگه وارد شو" },
    { box: "title", text: "لئو رو نشون نمی‌ده؛ همون جوابی که آدرس الکی می‌گیره" },
    { box: "back", text: "فقط برمی‌گرده به سگ‌های خودش" },
  ],
});
nextArrow({ from: s1.shotX - 40, to: s2.right + 40, y: 300, label: "یه حساب دیگه، همون آدرس" });

/*------ 3. The Admin's panel ------*/
const s3 = await step({
  name: "03-no-admin",
  col: 2,
  top: ROW1,
  number: "۳",
  title: "مشتری و پنل مدیریت",
  notes: [
    { box: "title", text: "آدرس پنل رو زد؛ برگشت به حساب خودش" },
    { box: "empty", text: "فقط سگ‌های خودش، که هنوز نداره" },
  ],
});
nextArrow({ from: s2.shotX - 40, to: s3.right + 40, y: 300, label: "آدرس پنل مدیریت" });

/*===== Row 2: partners =====*/
const ROW2 = Math.max(s1.bottom, s2.bottom, s3.bottom) + 420;

/*------ 4. A partner's people ------*/
const s4 = await step({
  name: "04-partner-leads",
  col: 1,
  top: ROW2,
  number: "۴",
  title: "همکار: شماره‌ها و مشتری‌ها",
  color: RETURNING,
  titleColor: RETURNING,
  notes: [
    { box: "name", text: "مشتری‌ای که آورده: اسمش و اینکه تا کجا اومده" },
    { box: "commission", text: "فقط پورسانت خودش؛ نه قیمت، نه دوره، نه سگ" },
    { box: "others", text: "شماره‌هایی که خودش نوشته" },
  ],
});
turnArrow({ from: s1, to: s4, label: "با حساب همکار: «مشتری‌ها»", color: RETURNING });

/*------ 5. A lead another partner won ------*/
const s5 = await step({
  name: "05-lost",
  col: 2,
  top: ROW2,
  number: "۵",
  title: "همکار دوم: شماره‌ای که مال یکی دیگه شد",
  color: RETURNING,
  titleColor: RETURNING,
  notes: [
    { box: "phone", text: "یه همکار دیگه زودتر همین شماره رو نوشته بود؛ اینجا فقط شماره‌ست، اسم آدم نمیاد" },
    { box: "road", text: "«از دست رفت»؛ نمی‌گه کدوم همکار بردش" },
  ],
});
nextArrow({ from: s4.shotX - 40, to: s5.right + 40, y: ROW2 + 300, label: "یه همکار دیگه", color: RETURNING });

await write(process.argv[2]);
