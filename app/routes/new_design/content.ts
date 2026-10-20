import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Content =====*/
// The real facts the new design tells, taken from the live home page; the wording is in the dog's voice, the facts
// (what happens, in what order, what is offered) stay.

/** The path from a new dog to training (app-spec F3, F5, F6). A real sequence, so the trail numbers it. */
export const STEPS = [
  { title: "درخواست ارزیابی رایگان", detail: "سگت را معرفی کن؛ عکس و فیلم کوتاه اختیاری است." },
  {
    title: `${HEAD_TRAINER.firstName} تماس می‌گیرد`,
    detail: `${HEAD_TRAINER.firstName} وقت هماهنگ می‌کند و سگت را از نزدیک می‌بیند. رایگان و بدون تعهد.`,
  },
  { title: "دوره‌های مناسب باز می‌شوند", detail: "بعد از ارزیابی، دوره‌هایی که به درد سگت می‌خورد باز می‌شود." },
  { title: "آموزش شروع می‌شود", detail: "بعد از خرید، جلسه‌ها را با هم هماهنگ می‌کنید." },
] as const;

/** The five services from the owner's business card. All breeds and ages. */
export const SERVICES = [
  { title: "آموزش پایه و پیشرفته", detail: "آموزش عمومی و فرمان‌پذیری، از اولین فرمان‌ها تا مهارت‌های پیشرفته." },
  { title: "رفتارشناسی و اصلاح رفتار", detail: "شناخت رفتار سگ و کمک به حل مشکلات رفتاری." },
  { title: "آموزش تخصصی", detail: "دفاع، ردیابی، گارد، اطاعت و آموزش سگ‌های نگهبان و ورزشی." },
  { title: "آمادگی برای مسابقات داخلی و بین‌المللی", detail: "تمرین و آموزش تا سطوح مسابقاتی." },
  { title: "مشاوره‌ی تخصصی قبل و بعد از آموزش", detail: "راهنمایی برای شروع آموزش و ادامه‌ی تمرین‌ها بعد از آن." },
] as const;

/**
 * Where training happens, as the help page words it. Group classes aren't running: never present them as open, and
 * boarding is only by prior arrangement.
 */
export const FORMATS = ["خصوصی در محل شما", "خصوصی در مرکز", "پانسیون همراه با آموزش، با هماهنگی قبلی"] as const;

/** The live app's pages every CTA must point at. */
export const LINKS = {
  evaluation: "/assessment",
  courses: "/courses",
  auth: "/auth",
  about: "/about",
  contact: "/contact",
  help: "/help",
} as const;
