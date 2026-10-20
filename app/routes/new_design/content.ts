import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Content =====*/
// The real facts the new design tells, taken from the live home page. The wording is spoken Persian (`می‌شه`, `رو`),
// the register the dog uses in his bubbles, so the page reads as one voice; the facts (what happens, in what order,
// what is offered) stay. Plain and concrete on purpose: the owner's customers found abstract lines («با حوصله و دقت»,
// «گزینه‌های انعطاف‌پذیر») machine-written (2026-10-20).

/** The path from a new dog to training (app-spec F3, F5, F6). A real sequence, so the trail numbers it. */
export const STEPS = [
  { title: "درخواست ارزیابی رایگان", detail: "سگت رو معرفی کن. اگه خواستی، یه عکس یا فیلم کوتاه هم بذار." },
  {
    title: `${HEAD_TRAINER.firstName} زنگ می‌زنه`,
    detail: `با هم یه وقت می‌ذارید و ${HEAD_TRAINER.firstName} سگت رو از نزدیک می‌بینه.`,
  },
  { title: "دوره‌ها باز می‌شن", detail: "توی حسابت می‌بینی کدوم دوره‌ها برای سگت بازه." },
  {
    title: "آموزش شروع می‌شه",
    detail: `بعد از پرداخت، ${HEAD_TRAINER.firstName} باهات تماس می‌گیره و جلسه‌ها رو با هم می‌چینید.`,
  },
] as const;

/** The five services from the owner's business card. All breeds and ages. */
export const SERVICES = [
  { title: "آموزش پایه و پیشرفته", detail: "فرمان‌پذیری عمومی، برای توله‌ها و سگ‌های بزرگ‌تر." },
  { title: "رفتارشناسی و اصلاح رفتار", detail: "برای وقتی که یه رفتار سگت زندگی رو براتون سخت کرده." },
  { title: "آموزش تخصصی", detail: "برای سگ‌هایی که قراره کار کنن: نگهبانی، ردیابی، دفاع و ورزش." },
  { title: "آمادگی برای مسابقات داخلی و بین‌المللی", detail: "برای وقتی که می‌خوای سگت رو ببری مسابقه." },
  {
    title: "مشاوره‌ی تخصصی قبل و بعد از آموزش",
    detail: `سؤال‌هات رو قبل از شروع و بعد از تموم شدن آموزش از خود ${HEAD_TRAINER.firstName} بپرس.`,
  },
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
