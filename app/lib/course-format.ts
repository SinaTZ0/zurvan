import { formatNumber } from "~/lib/locale-format";
import { COURSE_PLACE_LABELS } from "~/orpc/course/constants";
import type { Course } from "~/orpc/course/contract";
import { m } from "~/paraglide/messages";

/*===== Course Facts =====*/
// Every storefront page words a course's facts the same way. Sessions and ages on the owner's cards are approximate
// ("حدوداً"), and the pages say them that way too. Worded in the page's language (`messages/shared/`).

type Facts = Pick<Course, "minAgeMonths" | "maxAgeMonths" | "sessionCount">;

/** "از ۲ ماهگی", "۶ تا ۷ ماهگی", or "هر سنی" when there is no minimum. */
export function describeAge(course: Facts): string {
  if (course.minAgeMonths === null) return m.shared_course_age_any();
  if (course.maxAgeMonths !== null) {
    return m.shared_course_age_range({
      min: formatNumber(course.minAgeMonths),
      max: formatNumber(course.maxAgeMonths),
    });
  }
  return m.shared_course_age_from({ min: formatNumber(course.minAgeMonths) });
}

/** "حدوداً ۵ جلسه", or "بعد از ارزیابی" when the trainer decides it after seeing the dog. */
export function describeSessions(course: Facts): string {
  if (course.sessionCount === null) return m.shared_course_after_evaluation();
  const count = formatNumber(course.sessionCount);
  return course.sessionCount === 1
    ? m.shared_course_sessions_one({ count })
    : m.shared_course_sessions_other({ count });
}

/** The places a course can be taught, "منزل، بیرون، پانسیون", or "بعد از ارزیابی" when it offers none. */
export function describePlaces(course: Pick<Course, "places">): string {
  if (course.places.length === 0) return m.shared_course_after_evaluation();
  return course.places.map((place) => COURSE_PLACE_LABELS[place]).join(m.shared_place_list_joiner());
}

/** "سگ همدم ۱", or `null` when the course has no prerequisite. The dog must have passed each one (F4). */
export function describePrerequisites(course: Pick<Course, "prerequisites">): string | null {
  if (course.prerequisites.length === 0) return null;
  return course.prerequisites.map((required) => required.title).join(m.shared_course_list_joiner());
}

/*===== Money =====*/
// Prices are stored in Rial (spec 4) and shown in Toman, the unit people say out loud.
const RIAL_PER_TOMAN = 10;

/** `45000000` Rial → "۴٬۵۰۰٬۰۰۰ تومان", or "4,500,000 Toman" on the English pages. */
export function formatToman(rial: number): string {
  return m.shared_money_toman({ amount: formatNumber(Math.round(rial / RIAL_PER_TOMAN)) });
}

/**
 * The way people say a price: «۹۰۰ هزار تومان», «۸٫۵ میلیون تومان» ("8.5 million Toman"). Only when that is exact; any other amount is
 * written in full, so a refund or a total is never rounded on screen.
 */
export function formatTomanShort(rial: number): string {
  const toman = Math.round(rial / RIAL_PER_TOMAN);
  if (toman >= 1_000_000 && toman % 100_000 === 0) {
    return m.shared_money_million_toman({ amount: formatNumber(toman / 1_000_000) });
  }
  if (toman >= 1_000 && toman % 1_000 === 0)
    return m.shared_money_thousand_toman({ amount: formatNumber(toman / 1_000) });
  return formatToman(rial);
}

/*===== Latin Name =====*/
/**
 * Whether a course's Latin name adds anything under its title. On the English site the title is often the Latin name
 * already («Companion Dog 2» over «Companion dog 2»), and showing it twice reads as a bug; a Persian title always differs.
 */
export function latinNameAddsToTitle({ title, latinName }: { title: string; latinName: string }): boolean {
  return latinName.trim().toLowerCase() !== title.trim().toLowerCase();
}
