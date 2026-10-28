// Builds the index board: every feature board with its number, its title and what to try, each with a box to tick.
// Usage: node scripts/feature-boards/00-index.board.mjs [out.excalidraw]
import { INK, MUTED, SUBTLE, createBoard, wrap } from "./board-lib.mjs";

const { header, text, rect, write } = await createBoard({ name: "00-index" });

/*===== Boards =====*/
// The titles are the boards' own; «چی رو امتحان کنی» is one line of what to do on the site.
const BOARDS = [
  {
    number: "۰۱",
    title: "ورود و ثبت‌نام در سایت (موبایل)",
    tryIt: "با یه شماره‌ی تازه ثبت‌نام کن، بعد با یه شماره‌ی قدیمی وارد شو؛ مشتری تازه رو توی کاربران پیدا کن.",
  },
  {
    number: "۰۲",
    title: "معرفی سگ و پرونده‌ش",
    tryIt: "یه سگ دورگه رو در چهار قدم معرفی کن؛ بعد ببین سگ ارزیابی‌شده نژاد و تولدش قفله.",
  },
  {
    number: "۰۳",
    title: "ارزیابی رایگان",
    tryIt:
      "یه سگ تازه رو برای ارزیابی رایگان بفرست، توی پنل یکی رو «ارزیابی شد» و یکی رو با دلیل «رد» کن و ببین مشتری چی می‌بینه.",
  },
  {
    number: "۰۴",
    title: "دوره‌ها و اینکه کدوم سگ می‌تونه برداره",
    tryIt:
      "صفحه‌ی یه دوره رو باز کن و برای هر سگ ببین می‌تونه برداره یا چرا نه؛ بعد از «خرید دوره» همین رو از روی سگ ببین.",
  },
  {
    number: "۰۵",
    title: "سبد خرید و پرداخت",
    tryIt:
      "یه دوره برای سگ ارزیابی‌شده توی سبد بذار، جای آموزش رو انتخاب کن، پرداخت کن و رسیدش رو توی خریدها و پنل پرداخت‌ها ببین.",
  },
  {
    number: "۰۶",
    title: "ثبت‌نام‌ها: تمام شد و لغو",
    tryIt:
      "توی ثبت‌نام‌ها یه دوره رو «تمام شد» بزن و ببین دوره‌ی بعدی سگ برای خرید باز می‌شه؛ «لغو» رو هم روی یکی امتحان کن.",
  },
  {
    number: "۰۷",
    title: "همکارها، لینکشون و پورسانت",
    tryIt:
      "یه همکار تازه بساز، با لینکش یه مشتری ثبت‌نام کنه و دوره بخره، بعد پورسانتش رو «پرداخت شد» بزن و ببین همکار می‌بینه.",
  },
  {
    number: "۰۸",
    title: "پیامک‌ها",
    tryIt: "با یه مشتری ارزیابی بخواه، ارزیابی و رد کن، دوره بخر و تمومش کن؛ هر بار توی «پیامک‌ها» پیامکش رو ببین.",
  },
  {
    number: "۰۹",
    title: "تنظیمات پنل",
    tryIt:
      "پیش‌پرداخت رو ۵۰ کن و سبد یه مشتری رو ببین، بعد برش گردون به پیش‌فرض؛ پله‌های پورسانت و محدودیت کد ورود رو هم نگاه کن.",
  },
  {
    number: "۱۰",
    title: "نمای کلی پنل مدیریت",
    tryIt: "نمای کلی رو باز کن و روی چند تا عدد بزن؛ هر کدوم باید لیست خودش رو فیلترشده باز کنه.",
  },
  {
    number: "۱۱",
    title: "حریم خصوصی: کی چی رو نمی‌بینه",
    tryIt: "با یه حساب دیگه آدرس سگ سارا رو باز کن، آدرس پنل رو بزن، و ببین همکار قیمت و سگ و همکار دیگه رو نمی‌بینه.",
  },
  {
    number: "۱۲",
    title: "قوانین سایت و رضایت",
    tryIt: "آدرس قوانین باید «این صفحه اینجا نیست» بده و ثبت‌نام و سبد هیچ تیک قوانینی نداشته باشن.",
  },
  {
    number: "۱۳",
    title: "پرونده، دفترچه و گواهی سگ",
    tryIt: "برای یه سگ جلسه بنویس و گواهی صادر کن، از حساب صاحبش ببین، QR رو بدون ورود باز کن، بعد گواهی رو باطل کن.",
  },
  {
    number: "۱۴",
    title: "وبلاگ: نوشته‌های طلا",
    tryIt:
      "وبلاگ رو بگرد (حتی با ي عربی)، یه نوشته رو تا آخر بخون، بعد از پنل یه نوشته‌ی تازه بنویس، پیش‌نویسش کن و منتشرش کن.",
  },
  {
    number: "۱۵",
    title: "نسخه‌ی انگلیسی سایت",
    tryIt: "سایت رو به انگلیسی بگرد: دوره‌ها با قیمت Toman، ورود و حساب به انگلیسی؛ پنل مدیریت فارسی می‌مونه.",
  },
];

/*===== Header =====*/
header({
  title: "فهرست بردها",
  summary: "هر برد یه بخش سایته. روی سایت امتحانش کن و اگه درست بود، تیکش رو بزن.",
  signOff: false,
});

/*===== Rows =====*/
const ROW_HEIGHT = 130;
const WIDTH = 2600;
const TICK = 56;
const NUMBER_RIGHT = -TICK - 50;
const TITLE_RIGHT = NUMBER_RIGHT - 110;
const TITLE_WIDTH = 820;
const TRY_RIGHT = TITLE_RIGHT - TITLE_WIDTH - 60;
const TRY_WIDTH = WIDTH + TRY_RIGHT;

/** The top of a text block that sits centred on `middle`, however many lines it wraps to. */
function centred({ value, size, width, middle }) {
  const lines = wrap(value, size, width).split("\n").length;
  return middle - (lines * size * 1.25) / 2;
}

/*------ Column heads ------*/
const HEAD_Y = -120;
text({ right: 0, y: HEAD_Y, value: "تأیید", size: 24, color: SUBTLE, width: 120 });
text({ right: NUMBER_RIGHT, y: HEAD_Y, value: "شماره", size: 24, color: SUBTLE, width: 120 });
text({ right: TITLE_RIGHT, y: HEAD_Y, value: "برد", size: 24, color: SUBTLE, width: 300 });
text({ right: TRY_RIGHT, y: HEAD_Y, value: "چی رو امتحان کنی", size: 24, color: SUBTLE, width: 400 });

BOARDS.forEach(({ number, title, tryIt }, i) => {
  const top = -60 + i * ROW_HEIGHT;
  const middle = top + ROW_HEIGHT / 2;
  rect({ x: -WIDTH, y: top, w: WIDTH, h: 1, color: MUTED, width: 1 });
  rect({ x: -TICK, y: middle - TICK / 2, w: TICK, h: TICK, color: INK, width: 3, fill: "#ffffff" });
  text({ right: NUMBER_RIGHT, y: middle - 22, value: number, size: 36, width: 100 });
  text({
    right: TITLE_RIGHT,
    y: centred({ value: title, size: 30, width: TITLE_WIDTH, middle }),
    value: title,
    size: 30,
    width: TITLE_WIDTH,
  });
  text({
    right: TRY_RIGHT,
    y: centred({ value: tryIt, size: 22, width: TRY_WIDTH, middle }),
    value: tryIt,
    size: 22,
    color: SUBTLE,
    width: TRY_WIDTH,
  });
});
rect({ x: -WIDTH, y: -60 + BOARDS.length * ROW_HEIGHT, w: WIDTH, h: 1, color: MUTED, width: 1 });

await write(process.argv[2]);
