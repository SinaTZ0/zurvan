import { formatNumberFa } from "~/lib/digits";
import { COURSE_PLACE_LABELS } from "~/orpc/course/constants";
import type { Course } from "~/orpc/course/contract";

/*===== Course Facts =====*/
// Every storefront page words a course's facts the same way. Sessions and ages on the owner's cards are approximate
// ("حدوداً"), and the pages say them that way too.

type Facts = Pick<Course, "minAgeMonths" | "maxAgeMonths" | "sessionCount" | "place">;

/** "از ۲ ماهگی", "۶ تا ۷ ماهگی", or "هر سنی" when there is no minimum. */
export function describeAge(course: Facts): string {
  if (course.minAgeMonths === null) return "هر سنی";
  if (course.maxAgeMonths !== null) {
    return `${formatNumberFa(course.minAgeMonths)} تا ${formatNumberFa(course.maxAgeMonths)} ماهگی`;
  }
  return `از ${formatNumberFa(course.minAgeMonths)} ماهگی`;
}

/** "حدوداً ۵ جلسه", or "بعد از ارزیابی" when the trainer decides it after seeing the dog. */
export function describeSessions(course: Facts): string {
  return course.sessionCount === null ? "بعد از ارزیابی" : `حدوداً ${formatNumberFa(course.sessionCount)} جلسه`;
}

/** "منزل", "بیرون", "اکثراً بیرون", or "بعد از ارزیابی". */
export function describePlace(course: Facts): string {
  return course.place === null ? "بعد از ارزیابی" : COURSE_PLACE_LABELS[course.place];
}

/**
 * "سگ همدم ۱ یا قبولی در تست آن", or `null` when the course has no prerequisite. A required course with a test can be
 * skipped by passing that test (spec 3.6), so the sentence offers both.
 */
export function describePrerequisites(course: Pick<Course, "prerequisites">): string | null {
  if (course.prerequisites.length === 0) return null;
  return course.prerequisites
    .map((required) => (required.hasTest ? `${required.title} یا قبولی در تست آن` : required.title))
    .join("، و ");
}

/*===== Money =====*/
// Prices are stored in Rial (spec 4) and shown in Toman, the unit people say out loud.
const RIAL_PER_TOMAN = 10;

/** `45000000` Rial → "۴٬۵۰۰٬۰۰۰ تومان". */
export function formatToman(rial: number): string {
  return `${formatNumberFa(Math.round(rial / RIAL_PER_TOMAN))} تومان`;
}

/**
 * The way people say a price: «۹۰۰ هزار تومان», «۸٫۵ میلیون تومان». Only when that is exact; any other amount is
 * written in full, so a refund or a total is never rounded on screen.
 */
export function formatTomanShort(rial: number): string {
  const toman = Math.round(rial / RIAL_PER_TOMAN);
  if (toman >= 1_000_000 && toman % 100_000 === 0) return `${formatNumberFa(toman / 1_000_000)} میلیون تومان`;
  if (toman >= 1_000 && toman % 1_000 === 0) return `${formatNumberFa(toman / 1_000)} هزار تومان`;
  return formatToman(rial);
}
