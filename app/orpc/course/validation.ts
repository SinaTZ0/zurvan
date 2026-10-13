import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";
import { COURSE_PLACES, SELLABLE_COURSE_FAMILIES } from "~/orpc/course/constants";

/*===== Limits =====*/
export const COURSE_TITLE_MAX_LENGTH = 60;
export const COURSE_SUMMARY_MAX_LENGTH = 400;
export const COURSE_HIGHLIGHTS_MAX_LINES = 6;
export const COURSE_COMMANDS_MAX_LINES = 40;
export const COURSE_LINE_MAX_LENGTH = 200;
export const COURSE_COVER_ALT_MIN_LENGTH = 5;
export const COURSE_COVER_ALT_MAX_LENGTH = 200;
export const COURSE_SLUG_MIN_LENGTH = 2;
export const COURSE_SLUG_MAX_LENGTH = 40;
export const COURSE_MAX_AGE_MONTHS = 240;
export const COURSE_MAX_SESSIONS = 60;
export const COURSE_MAX_PREREQUISITES = 6;
/** Rial. Prices the form sends are Toman × 10, so the lowest is 1,000 Toman and the highest 10 billion. */
export const COURSE_MIN_PRICE = 10_000;
export const COURSE_MAX_PRICE = 100_000_000_000;

/*===== Messages =====*/
export const COURSE_SLUG_TAKEN_MESSAGE = "این نشانی قبلاً برای دوره‌ی دیگری گرفته شده.";
export const COURSE_COVER_REQUIRED_MESSAGE = "یک عکس برای دوره بگذار.";
export const COURSE_COVER_INVALID_MESSAGE = "عکس را دوباره بارگذاری کن.";
export const COURSE_PREREQUISITE_UNKNOWN_MESSAGE = "یکی از پیش‌نیازها پیدا نشد؛ صفحه را تازه کن.";
export const COURSE_PREREQUISITE_SELF_MESSAGE = "یک دوره نمی‌تواند پیش‌نیاز خودش باشد.";

/** A cycle would lock both courses for ever: each waits for the other to be passed. */
export function courseCycleMessage({ requiredTitle, title }: { requiredTitle: string; title: string }): string {
  return `این دوره‌ها همدیگر را لازم دارند: ${requiredTitle} از قبل ${title} را لازم دارد.`;
}

const SLUG_MESSAGE = `نشانی فقط از حرف کوچک انگلیسی، رقم و خط تیره ساخته می‌شود و ${formatNumberFa(COURSE_SLUG_MIN_LENGTH)} تا ${formatNumberFa(COURSE_SLUG_MAX_LENGTH)} نویسه است.`;

/*===== Fields =====*/
/** A required one-line name: trimmed, so a name of spaces counts as empty. */
function nameSchema({ label, max }: { label: string; max: number }) {
  return z
    .string()
    .trim()
    .min(1, `${label} را بنویس.`)
    .max(max, `${label} حداکثر ${formatNumberFa(max)} حرف است.`);
}

/**
 * Lines as typed: each trimmed, blank ones dropped. The limits are checked on the whole list (not per line) so a
 * failure is reported on the list's own field (`highlights`), never on `highlights.3`.
 */
function linesSchema({ label, maxLines }: { label: string; maxLines: number }) {
  return z
    .array(z.string())
    .transform((lines) => lines.map((line) => line.trim()).filter(Boolean))
    .refine((lines) => lines.length <= maxLines, `${label} حداکثر ${formatNumberFa(maxLines)} خط است.`)
    .refine(
      (lines) => lines.every((line) => line.length <= COURSE_LINE_MAX_LENGTH),
      `هر خطِ ${label} حداکثر ${formatNumberFa(COURSE_LINE_MAX_LENGTH)} حرف است.`,
    );
}

function monthsSchema(label: string) {
  const message = `${label} باید بین ${formatNumberFa(0)} تا ${formatNumberFa(COURSE_MAX_AGE_MONTHS)} ماه باشد.`;
  return z.number().int().min(0, message).max(COURSE_MAX_AGE_MONTHS, message).nullable();
}

function priceSchema(label: string) {
  return z
    .number()
    .int()
    .min(COURSE_MIN_PRICE, `${label} حداقل ${formatNumberFa(COURSE_MIN_PRICE / 10)} تومان است.`)
    .max(COURSE_MAX_PRICE, `${label} حداکثر ${formatNumberFa(COURSE_MAX_PRICE / 10)} تومان است.`)
    .nullable();
}

/*===== Course =====*/
/**
 * The course form as the service accepts it: trimming and limits, and the rules that read only the input. What needs
 * the database (the slug, the prerequisites, the cover) is checked by the service. Messages surface as field errors.
 */
export const courseFormSchema = z
  .object({
    title: nameSchema({ label: "نام دوره", max: COURSE_TITLE_MAX_LENGTH }),
    latinName: nameSchema({ label: "نام لاتین", max: COURSE_TITLE_MAX_LENGTH }),
    family: z.enum(SELLABLE_COURSE_FAMILIES, "خانواده‌ی دوره را انتخاب کن."),
    summary: z
      .string()
      .trim()
      .min(1, "توضیح کوتاه را بنویس.")
      .max(COURSE_SUMMARY_MAX_LENGTH, `توضیح کوتاه حداکثر ${formatNumberFa(COURSE_SUMMARY_MAX_LENGTH)} حرف است.`),
    highlights: linesSchema({ label: "نتیجه‌ها", maxLines: COURSE_HIGHLIGHTS_MAX_LINES }),
    commands: linesSchema({ label: "فرمان‌ها", maxLines: COURSE_COMMANDS_MAX_LINES }),
    coverAlt: z
      .string()
      .trim()
      .min(COURSE_COVER_ALT_MIN_LENGTH, "توضیح عکس را بنویس: صحنه‌ی عکس را در یک جمله بگو.")
      .max(COURSE_COVER_ALT_MAX_LENGTH, `توضیح عکس حداکثر ${formatNumberFa(COURSE_COVER_ALT_MAX_LENGTH)} حرف است.`),
    minAgeMonths: monthsSchema("حداقل سن"),
    maxAgeMonths: monthsSchema("حداکثر سن"),
    sessionCount: z
      .number()
      .int()
      .min(1, "تعداد جلسه‌ها حداقل یکی است.")
      .max(COURSE_MAX_SESSIONS, `تعداد جلسه‌ها حداکثر ${formatNumberFa(COURSE_MAX_SESSIONS)} است.`)
      .nullable(),
    place: z.enum(COURSE_PLACES).nullable(),
    price: priceSchema("قیمت"),
    boardingPrice: priceSchema("قیمت نگهداری"),
    prerequisites: z
      .array(z.string().trim())
      .max(COURSE_MAX_PREREQUISITES, `حداکثر ${formatNumberFa(COURSE_MAX_PREREQUISITES)} پیش‌نیاز می‌شود گذاشت.`)
      .refine((slugs) => new Set(slugs).size === slugs.length, "یک دوره را دو بار انتخاب کرده‌ای."),
  })
  .superRefine((value, context) => {
    if (value.minAgeMonths !== null && value.maxAgeMonths !== null && value.minAgeMonths > value.maxAgeMonths) {
      context.addIssue({
        code: "custom",
        path: ["maxAgeMonths"],
        message: "حداکثر سن نمی‌تواند از حداقل سن کمتر باشد.",
      });
    }
  });

export type CourseForm = z.output<typeof courseFormSchema>;

/*===== Slug =====*/
/** The address of a new course: lowercase words joined by single dashes. It never changes afterwards. */
export const courseSlugSchema = z
  .string()
  .trim()
  .min(COURSE_SLUG_MIN_LENGTH, SLUG_MESSAGE)
  .max(COURSE_SLUG_MAX_LENGTH, SLUG_MESSAGE)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, SLUG_MESSAGE);
