import type { CourseBookingKind, CourseFamily, CoursePlace } from "~/orpc/course/constants";

/*===== Refund Policies =====*/
// The spec's example presets (3.9). The Admin will manage these; the seed only makes sure they exist.
export const SEED_REFUND_POLICIES = [
  {
    name: "منعطف",
    customerDescription: "تا اولین جلسه، کل مبلغ برمی‌گردد. بعد از آن هم کل سهم جلسه‌های برگزارنشده برمی‌گردد.",
    unheldRefundPercent: 100,
  },
  {
    name: "متوسط",
    customerDescription: "تا اولین جلسه، کل مبلغ برمی‌گردد. بعد از آن، نصف سهم جلسه‌های برگزارنشده برمی‌گردد.",
    unheldRefundPercent: 50,
  },
  {
    name: "سخت‌گیرانه",
    customerDescription: "تا اولین جلسه، کل مبلغ برمی‌گردد. بعد از آن، مبلغی برنمی‌گردد.",
    unheldRefundPercent: 0,
  },
] as const;

/** Every seeded course uses this preset until the owner picks one per course. */
export const SEED_DEFAULT_REFUND_POLICY = "متوسط";

/*===== Courses =====*/
type SeedCourse = {
  slug: string;
  title: string;
  latinName: string;
  family: CourseFamily;
  bookingKind?: CourseBookingKind;
  summary: string;
  highlights: string[];
  commands: string[];
  cover: { src: string; alt: string; width: number; height: number };
  minAgeMonths?: number;
  maxAgeMonths?: number;
  sessionCount?: number;
  place?: CoursePlace;
  /** Toman, converted to Rial when seeded. */
  priceToman?: number;
  boardingPriceToman?: number;
  testPriceToman?: number;
  /** Slugs of the courses this one requires. */
  requires?: string[];
};

// The owner's eleven course cards (docs/zurvan-courses.md), in catalogue order.
//
// Sample data: the prices and the cover photos are placeholders until the owner sends the real ones. The doc leaves
// prices out on purpose. A missing boarding price shows as "price on request".
export const SEED_COURSES: SeedCourse[] = [
  {
    slug: "house-manner",
    title: "سگ خونگی",
    latinName: "House manner",
    family: "basics",
    summary: "قواعد زندگی در خانه: جا و دستشویی، رفتار با مهمان و در، تنها ماندن و آرام ماندن. همه در خانه‌ی خودتان.",
    highlights: ["احترام به مهمان و نپریدن رویش", "قواعد در: سمت در نرفتن و بیرون نرفتن", "گاز نگرفتن و کنترل هیجان"],
    commands: [
      "نام، لورینگ و مارکرها",
      "بشین، بایست، خواب",
      "جا و باکس",
      "دستشویی",
      "احترام به مهمان",
      "قواعد در: سمت در نرفتن و از در بیرون نرفتن",
      "هم‌قدم عالی",
      "گدایی نکردن خوراک",
      "قواعد اولیه: رتبه‌بندی، مرز، محدودیت و صبر",
      "ماندن در جا",
      "تنها ماندن",
      "سکوت",
      "لیش پرشر",
      "کنترل هیجان",
      "گاز نگرفتن",
      "اسباب‌بازی، اگر سگ انگیزه‌اش را دارد",
    ],
    cover: { src: "/demo/course-city.jpg", alt: "یک گلدن رتریور خوشحال در کافه", width: 300, height: 200 },
    minAgeMonths: 2,
    sessionCount: 5,
    place: "home",
    priceToman: 4_500_000,
    boardingPriceToman: 3_000_000,
  },
  {
    slug: "cgc",
    title: "سگ اجتماعی",
    latinName: "CGC",
    family: "basics",
    summary:
      "سگ یاد می‌گیرد در برابر آدم‌ها، سگ‌های دیگر و صداها آرام بماند. از سشوار و جاروبرقی تا دست دامپزشک و غریبه‌ها.",
    highlights: [
      "نترسیدن از جاروبرقی، سشوار و صداهای بلند",
      "آرام ماندن زیر دست دامپزشک و آرایشگر",
      "هم‌قدم با قلاده‌ی شل از کنار جمعیت",
    ],
    commands: [
      "نام، لورینگ و مارکرها",
      "حساسیت‌زدایی: بدن، قلاده، ناخن‌گیر، سشوار، جاروبرقی، زنگ در و صداهای بلند",
      "اجتماعی‌سازی با آدم‌ها و حیوان‌ها",
      "بشین، بایست، خواب",
      "آرام ماندن وقتی غریبه به سرپرست نزدیک می‌شود",
      "لمس، نوازش و شانه‌کشی توسط غریبه، مثل دامپزشک و آرایشگر",
      "ماندن با فاصله، با قلاده",
      "سپرده شدن به غریبه و آرام ماندن",
      "هم‌قدم با قلاده‌ی شل",
      "هم‌قدم از کنار جمعیت",
      "هم‌قدم و احوال‌پرسی با غریبه‌ای که سگ همراه دارد",
      "هم‌قدم: دور کامل، به چپ، به راست، بیا",
      "نگاه به سرپرست به‌جای وسایل و صداها",
    ],
    cover: {
      src: "/demo/course-obedience.jpg",
      alt: "مربی زانو زده و سگ کوچکی جلویش نشسته است",
      width: 300,
      height: 200,
    },
    minAgeMonths: 2,
    sessionCount: 12,
    place: "home",
    priceToman: 9_000_000,
    boardingPriceToman: 6_000_000,
    testPriceToman: 1_800_000,
  },
  {
    slug: "bmc",
    title: "مخصوص سگ‌های شش‌ماهه",
    latinName: "BMC",
    family: "six-month",
    summary:
      "شش‌ماهگی سنی است که سگ مرزها را امتحان می‌کند. این دوره همان موقع، بیرون از خانه، رفتارش با غریبه‌ها و سگ‌های دیگر را می‌سازد.",
    highlights: [
      "آرام ماندن وقتی غریبه یا سگ دیگری نزدیک می‌شود",
      "سپرده شدن به غریبه بدون اضطراب",
      "بیا، بشین، بایست و خواب، همه در بیرون",
    ],
    commands: [
      "حساسیت‌زدایی بدن و شانه‌کشی، توسط ما و غریبه",
      "حساسیت‌زدایی ناخن‌گیر، سشوار و جاروبرقی",
      "گرفتن قلاده، توسط ما و غریبه",
      "زنگ در، افتادن وسایل و صداهای بلند",
      "اجتماعی‌سازی با آدم‌ها و حیوان‌ها",
      "نزدیک شدن غریبه به سرپرست، سگ در گوشه یا کنار سرپرست",
      "نزدیک شدن غریبه‌ی سگ‌به‌همراه به سرپرست",
      "سپرده شدن به غریبه",
      "ماندن با فاصله در خواب یا بشین، وقتی سرپرست دیده نمی‌شود",
      "هم‌قدم با قلاده‌ی شل، به چپ، به راست و دور کامل",
      "بیا، بشین، بایست، خواب، همه در بیرون",
    ],
    cover: {
      src: "/demo/course-agility.jpg",
      alt: "سگ بوردر کالی روی نرده‌ی چوبی ایستاده است",
      width: 300,
      height: 200,
    },
    minAgeMonths: 6,
    maxAgeMonths: 7,
    sessionCount: 12,
    place: "outside",
    priceToman: 9_500_000,
  },
  {
    slug: "elementary",
    title: "فرمان‌پذیری مقدماتی",
    latinName: "Elementary",
    family: "obedience",
    summary: "پایه‌ی فرمان‌پذیری: بشین، بایست، خواب، هم‌قدم و بیا، به‌علاوه‌ی آشنایی با قلاده و قواعد خانه.",
    highlights: ["آشنایی با قلاده و راه رفتن بدون کشیدن", "هم‌قدم، بمون و بیا", "بخور و نخور"],
    commands: [
      "قواعد: رتبه‌بندی، مرز، محدودیت و صبر",
      "نام، لورینگ و مارکرها",
      "آشنایی با قلاده",
      "حساسیت‌زدایی: بدن، صداها، وسایل، سشوار، جاروبرقی و در",
      "بشین، بایست، خواب",
      "دست چپ و راست، بزن قدش",
      "جا و باکس",
      "هم‌قدم، بمون، بیا",
      "اجتماعی‌سازی",
      "بخور و نخور",
      "تنها ماندن",
      "لیش پرشر",
      "دستشویی",
    ],
    cover: { src: "/demo/course-leash.jpg", alt: "چند سگ با قلاده در جاده‌ای خاکی", width: 300, height: 200 },
    minAgeMonths: 2,
    sessionCount: 7,
    place: "home",
    priceToman: 6_000_000,
    boardingPriceToman: 4_000_000,
  },
  {
    slug: "advanced",
    title: "فرمان‌پذیری حرفه‌ای",
    latinName: "Advanced",
    family: "obedience",
    summary: "فرمان‌ها در بیرون و برای مدت طولانی. سگ با اولین صدا برمی‌گردد و با غریبه جایی نمی‌رود.",
    highlights: ["آمدن با صدا زدن و ماندن", "خوراک نگرفتن از غریبه", "بشین، خواب و بایست برای مدت طولانی"],
    commands: [
      "هم‌قدم حرفه‌ای",
      "بشین، خواب و بایست برای مدت طولانی",
      "بیا، بمون",
      "خوراک نگرفتن از غریبه",
      "اجتماعی‌سازی",
      "دور بزن، بچرخ",
      "با غریبه جایی نرفتن",
      "پریدن از موانع کوتاه",
    ],
    cover: {
      src: "/demo/course-recall.jpg",
      alt: "یک سگ کورگی در چمنزار که به بالا نگاه می‌کند",
      width: 300,
      height: 450,
    },
    minAgeMonths: 4,
    sessionCount: 10,
    place: "mostly-outside",
    priceToman: 9_000_000,
  },
  {
    slug: "companion-1",
    title: "سگ همدم ۱",
    latinName: "Companion dog 1",
    family: "companion",
    summary: "قدم اول مسیر سگ همدم: قواعد اولیه، اتصال چشمی، دستشویی و هم‌قدم با قلاده.",
    highlights: ["اتصال چشمی", "بشین، بایست، خواب و بمون", "تنها ماندن"],
    commands: [
      "قواعد اولیه: صبر، مرز، محدودیت و رتبه‌بندی",
      "نام، لورینگ و مارکرها",
      "اتصال چشمی",
      "آشنایی با قلاده",
      "دستشویی",
      "بشین، بایست، خواب، بمون",
      "هم‌قدم با قلاده",
      "تنها ماندن",
    ],
    cover: { src: "/demo/course-puppy.jpg", alt: "دو توله‌گلدن رتریور روی چمن نشسته‌اند", width: 300, height: 225 },
    minAgeMonths: 2,
    sessionCount: 5,
    place: "home",
    priceToman: 3_500_000,
    boardingPriceToman: 2_500_000,
    testPriceToman: 1_200_000,
  },
  {
    slug: "companion-2",
    title: "سگ همدم ۲",
    latinName: "Companion dog 2",
    family: "companion",
    summary: "هم‌قدم بیرون، جا و باکس، حساسیت‌زدایی و اجتماعی‌سازی، و یک حرکت نمایشی به انتخاب تو.",
    highlights: ["هم‌قدم بیرون", "نترسیدن از ناخن‌گیر، سشوار و جاروبرقی", "یک حرکت نمایشی به انتخاب تو"],
    commands: [
      "گرفتن قلاده",
      "هم‌قدم بیرون",
      "جا و باکس",
      "حساسیت‌زدایی: ناخن‌گیر، سشوار، جاروبرقی، لمس بدن، صداها و وسایل",
      "اجتماعی‌سازی",
      "دست چپ و راست",
      "بیا",
      "یک حرکت نمایشی به انتخاب تو",
    ],
    cover: {
      src: "/photo/deal-anxiety.jpg",
      alt: "سگ پامرانین روی کاناپه دستش را در دست صاحبش گذاشته است",
      width: 800,
      height: 600,
    },
    minAgeMonths: 3,
    sessionCount: 5,
    place: "home",
    priceToman: 4_000_000,
    boardingPriceToman: 2_500_000,
    testPriceToman: 1_200_000,
    requires: ["companion-1"],
  },
  {
    slug: "companion-3",
    title: "سگ همدم ۳",
    latinName: "Companion dog 3",
    family: "companion",
    summary: "قواعد مهمان و در، و فرمان‌های حرفه‌ای‌تر در بیرون تا دو دقیقه.",
    highlights: ["قواعد مهمان و در", "بشین، بایست و خواب در بیرون تا دو دقیقه", "بخور و نخور"],
    commands: [
      "بخور و نخور",
      "قواعد مهمان",
      "لیش پرشر",
      "بشین، بایست و خواب در بیرون تا دو دقیقه",
      "قواعد در",
      "هم‌قدم حرفه‌ای‌تر",
      "یک حرکت نمایشی به انتخاب تو",
      "اسباب‌بازی، اگر سگ انگیزه‌اش را دارد",
    ],
    cover: { src: "/photo/cta-park.jpg", alt: "زنی روی چمن پارک کنار دو سگ نشسته است", width: 1400, height: 934 },
    minAgeMonths: 5,
    sessionCount: 5,
    place: "outside",
    priceToman: 4_500_000,
    testPriceToman: 1_500_000,
    requires: ["companion-2"],
  },
  {
    slug: "companion-4",
    title: "سگ همدم ۴",
    latinName: "Companion dog 4",
    family: "companion",
    summary: "آخرین قدم: فرمان‌ها در هر شرایطی در بیرون، و سگی که به غریبه گوش نمی‌دهد.",
    highlights: ["آمدن با صدا زدن در بیرون", "با غریبه جایی نرفتن و به دستورش گوش ندادن", "پریدن از موانع"],
    commands: [
      "بیا، در بیرون",
      "خوراک نگرفتن از غریبه",
      "با غریبه جایی نرفتن",
      "گوش ندادن به دستور غریبه",
      "بشین، بایست و خواب در هر شرایطی در بیرون",
      "پریدن از موانع",
      "بازی در بیرون، اگر سگ انگیزه‌ی اسباب‌بازی دارد",
    ],
    cover: {
      src: "/photo/deal-agility.jpg",
      alt: "زنی در زمین تمرین کنار سگ بوردر کالی می‌دود",
      width: 800,
      height: 600,
    },
    minAgeMonths: 8,
    sessionCount: 7,
    place: "outside",
    priceToman: 6_000_000,
    requires: ["companion-3"],
  },
  {
    slug: "working-dogs",
    title: "سگ‌های کار",
    latinName: "Working dogs",
    family: "working",
    summary: "برای سگ‌هایی که کار واقعی می‌کنند: نگهبانی، حفاظت، خدمت و ردیابی.",
    highlights: [],
    // The card lists only the branches; ages, sessions and places come after the assessment.
    commands: ["نگهبان محل", "بادی‌گارد", "سگ سرویس", "سگ آلارم", "ردیاب"],
    cover: {
      src: "/photo/deal-city.jpg",
      alt: "مربی در پیاده‌رو با سگی که روی دو پا ایستاده تمرین می‌کند",
      width: 800,
      height: 600,
    },
  },
  {
    slug: "sport",
    title: "سگ‌های ورزشی",
    latinName: "Sport",
    family: "sport",
    summary: "برای سگ‌هایی که برای مسابقه و ورزش‌های سگی آماده می‌شوند.",
    highlights: [],
    commands: ["BH", "IGP 1–3", "FH", "WUSV"],
    cover: {
      src: "/photo/deal-agility.jpg",
      alt: "زنی در زمین تمرین کنار سگ بوردر کالی می‌دود",
      width: 800,
      height: 600,
    },
  },
  {
    slug: "behavior-modification",
    title: "اصلاح رفتار",
    latinName: "Behavior modification",
    family: "behavior",
    bookingKind: "behavior-request",
    summary:
      "برای هر سن و هر نژاد. مشکل را انتخاب کن، توضیح بده و ویدیویی از رفتار سگت بفرست تا پیش از اولین جلسه بررسی شود.",
    highlights: ["اضطراب جدایی", "پرخاشگری به انسان یا حیوان", "خطای دستشویی، مدفوع‌خواری و آشغال‌خواری"],
    // The problems a request can be about (spec 3.7), in the owner's order. "سایر" is left off the card.
    commands: [
      "پرخاشگری به انسان",
      "پرخاشگری به حیوان",
      "پرخاشگری به صاحب",
      "گاز گرفتن بی‌مورد",
      "گاز گرفتن بازیگوشانه",
      "اضطراب جدایی",
      "خطای دستشویی",
      "مدفوع‌خواری",
      "آشغال‌خواری",
    ],
    cover: {
      src: "/demo/course-anxiety.jpg",
      alt: "زنی کنار پنجره سگش را در آغوش گرفته است",
      width: 300,
      height: 450,
    },
  },
];
