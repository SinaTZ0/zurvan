import { formatNumberFa } from "~/lib/digits";

/*===== Courses =====*/
// The real catalog from docs/zurvan-courses.md, until courses come from the database. Prices are left out on purpose,
// as in the doc. Every course can be taught at a boarding kennel instead if the owner wants, so that is said once on
// the page rather than repeated on each course.
export type Course = {
  slug: string;
  title: string;
  /** The name on the owner's course card, which dog people use as-is. */
  latinName: string;
  /** In months. `null` when the doc doesn't give one. */
  minAge: number | null;
  /** In months, for the one course with an upper bound (BMC). */
  maxAge?: number;
  /** Roughly how many sessions; `null` when it is decided after the assessment. */
  sessions: number | null;
  /** Where the sessions happen, as the card says it. `null` when it is decided after the assessment. */
  place: string | null;
  prerequisite?: string;
  /** One or two sentences on what the course is for, in the owner's terms. */
  summary: string;
  /** A few of the card's commands, the ones an owner would recognize as their problem solved. */
  highlights: string[];
  /** Behavior modification starts from a request with a video, not from booking an assessment. */
  kind: "course" | "behavior";
};

const COURSES: Course[] = [
  {
    slug: "house-manner",
    title: "سگ خونگی",
    latinName: "House manner",
    minAge: 2,
    sessions: 5,
    place: "منزل",
    summary: "قواعد زندگی در خانه: جا و دستشویی، رفتار با مهمان و در، تنها ماندن و آرام ماندن. همه در خانه‌ی خودتان.",
    highlights: ["احترام به مهمان و نپریدن رویش", "قواعد در: سمت در نرفتن و بیرون نرفتن", "گاز نگرفتن و کنترل هیجان"],
    kind: "course",
  },
  {
    slug: "cgc",
    title: "سگ اجتماعی",
    latinName: "CGC",
    minAge: 2,
    sessions: 12,
    place: "منزل",
    summary:
      "سگ یاد می‌گیرد در برابر آدم‌ها، سگ‌های دیگر و صداها آرام بماند. از سشوار و جاروبرقی تا دست دامپزشک و غریبه‌ها.",
    highlights: [
      "نترسیدن از جاروبرقی، سشوار و صداهای بلند",
      "آرام ماندن زیر دست دامپزشک و آرایشگر",
      "هم‌قدم با قلاده‌ی شل از کنار جمعیت",
    ],
    kind: "course",
  },
  {
    slug: "bmc",
    title: "مخصوص سگ‌های شش‌ماهه",
    latinName: "BMC",
    minAge: 6,
    maxAge: 7,
    sessions: 12,
    place: "بیرون",
    summary:
      "شش‌ماهگی سنی است که سگ مرزها را امتحان می‌کند. این دوره همان موقع، بیرون از خانه، رفتارش با غریبه‌ها و سگ‌های دیگر را می‌سازد.",
    highlights: [
      "آرام ماندن وقتی غریبه یا سگ دیگری نزدیک می‌شود",
      "سپرده شدن به غریبه بدون اضطراب",
      "بیا، بشین، بایست و خواب، همه در بیرون",
    ],
    kind: "course",
  },
  {
    slug: "elementary",
    title: "فرمان‌پذیری مقدماتی",
    latinName: "Elementary",
    minAge: 2,
    sessions: 7,
    place: "منزل",
    summary: "پایه‌ی فرمان‌پذیری: بشین، بایست، خواب، هم‌قدم و بیا، به‌علاوه‌ی آشنایی با قلاده و قواعد خانه.",
    highlights: ["آشنایی با قلاده و راه رفتن بدون کشیدن", "هم‌قدم، بمون و بیا", "بخور و نخور"],
    kind: "course",
  },
  {
    slug: "advanced",
    title: "فرمان‌پذیری حرفه‌ای",
    latinName: "Advanced",
    minAge: 4,
    sessions: 10,
    place: "اکثراً بیرون",
    summary: "فرمان‌ها در بیرون و برای مدت طولانی. سگ با اولین صدا برمی‌گردد و با غریبه جایی نمی‌رود.",
    highlights: ["آمدن با صدا زدن و ماندن", "خوراک نگرفتن از غریبه", "بشین، خواب و بایست برای مدت طولانی"],
    kind: "course",
  },
  {
    slug: "companion-1",
    title: "سگ همدم ۱",
    latinName: "Companion dog 1",
    minAge: 2,
    sessions: 5,
    place: "منزل",
    summary: "قدم اول مسیر سگ همدم: قواعد اولیه، اتصال چشمی، دستشویی و هم‌قدم با قلاده.",
    highlights: ["اتصال چشمی", "بشین، بایست، خواب و بمون", "تنها ماندن"],
    kind: "course",
  },
  {
    slug: "companion-2",
    title: "سگ همدم ۲",
    latinName: "Companion dog 2",
    minAge: 3,
    sessions: 5,
    place: "منزل",
    prerequisite: "سگ همدم ۱ یا قبولی در تست آن",
    summary: "هم‌قدم بیرون، جا و باکس، حساسیت‌زدایی و اجتماعی‌سازی، و یک حرکت نمایشی به انتخاب تو.",
    highlights: ["هم‌قدم بیرون", "نترسیدن از ناخن‌گیر، سشوار و جاروبرقی", "یک حرکت نمایشی به انتخاب تو"],
    kind: "course",
  },
  {
    slug: "companion-3",
    title: "سگ همدم ۳",
    latinName: "Companion dog 3",
    minAge: 5,
    sessions: 5,
    place: "بیرون",
    prerequisite: "سگ همدم ۲ یا قبولی در تست آن",
    summary: "قواعد مهمان و در، و فرمان‌های حرفه‌ای‌تر در بیرون تا دو دقیقه.",
    highlights: ["قواعد مهمان و در", "بشین، بایست و خواب در بیرون تا دو دقیقه", "بخور و نخور"],
    kind: "course",
  },
  {
    slug: "companion-4",
    title: "سگ همدم ۴",
    latinName: "Companion dog 4",
    minAge: 8,
    sessions: 7,
    place: "بیرون",
    prerequisite: "سگ همدم ۳ یا قبولی در تست آن",
    summary: "آخرین قدم: فرمان‌ها در هر شرایطی در بیرون، و سگی که به غریبه گوش نمی‌دهد.",
    highlights: ["آمدن با صدا زدن در بیرون", "با غریبه جایی نرفتن و به دستورش گوش ندادن", "پریدن از موانع"],
    kind: "course",
  },
  {
    slug: "behavior-modification",
    title: "اصلاح رفتار",
    latinName: "Behavior modification",
    minAge: null,
    sessions: null,
    place: null,
    summary:
      "برای هر سن و هر نژاد. مشکل را انتخاب کن، توضیح بده و ویدیویی از رفتار سگت بفرست تا پیش از اولین جلسه بررسی شود.",
    highlights: ["اضطراب جدایی", "پرخاشگری به انسان یا حیوان", "خطای دستشویی، مدفوع‌خواری و آشغال‌خواری"],
    kind: "behavior",
  },
];

/** Looks a course up by slug. Throws on a typo, since every slug here is written by hand. */
export function getCourse(slug: string): Course {
  const course = COURSES.find((entry) => entry.slug === slug);
  if (!course) throw new Error(`Unknown course: ${slug}`);
  return course;
}

/*===== Course Facts =====*/
// Sessions and ages on the owner's cards are approximate ("حدوداً"), and the page says them the same way.

/** "از ۲ ماهگی", "۶ تا ۷ ماهگی", or "هر سنی" when there is no minimum. */
export function describeAge(course: Course): string {
  if (course.minAge === null) return "هر سنی";
  if (course.maxAge) return `${formatNumberFa(course.minAge)} تا ${formatNumberFa(course.maxAge)} ماهگی`;
  return `از ${formatNumberFa(course.minAge)} ماهگی`;
}

/** "حدوداً ۵ جلسه", or "بعد از ارزیابی" when the trainer decides it after seeing the dog. */
export function describeSessions(course: Course): string {
  return course.sessions === null ? "بعد از ارزیابی" : `حدوداً ${formatNumberFa(course.sessions)} جلسه`;
}

/** "منزل", "بیرون", or "بعد از ارزیابی". */
export function describePlace(course: Course): string {
  return course.place ?? "بعد از ارزیابی";
}

/*===== Advanced Tracks =====*/
// Working and sport dogs have only their branches on the owner's cards, no ages, sessions or places yet.
export const ADVANCED_TRACKS = [
  {
    slug: "working-dogs",
    title: "سگ‌های کار",
    branches: ["نگهبان محل", "بادی‌گارد", "سگ سرویس", "سگ آلارم", "ردیاب"],
  },
  { slug: "sport", title: "سگ‌های ورزشی", branches: ["BH", "IGP 1–3", "FH", "WUSV"] },
] as const;
