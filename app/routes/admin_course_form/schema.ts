import type { DefaultValues } from "react-hook-form";
import { z } from "zod";

import { formatNumberFa, toLatinDigits, toPersianDigits } from "~/lib/digits";
import { COURSE_PLACES, SELLABLE_COURSE_FAMILIES } from "~/orpc/course/constants";
import type { AdminCourse, CourseInput } from "~/orpc/course/contract";
import {
  COURSE_COMMANDS_MAX_LINES,
  COURSE_COVER_ALT_MAX_LENGTH,
  COURSE_COVER_ALT_MIN_LENGTH,
  COURSE_HIGHLIGHTS_MAX_LINES,
  COURSE_LINE_MAX_LENGTH,
  COURSE_MAX_AGE_MONTHS,
  COURSE_MAX_PREREQUISITES,
  COURSE_MAX_PRICE,
  COURSE_MAX_SESSIONS,
  COURSE_MIN_PRICE,
  COURSE_SLUG_MAX_LENGTH,
  COURSE_SLUG_MIN_LENGTH,
  COURSE_SUMMARY_MAX_LENGTH,
  COURSE_TITLE_MAX_LENGTH,
} from "~/orpc/course/validation";

/*===== Course Form =====*/
// Written for the person filling it in: numbers are typed text (Persian digits welcome), money is Toman, the two lists
// are one item per line, and «بعد از ارزیابی» is a pill of its own. The server checks everything again
// (`app/orpc/course/validation.ts`); the two are kept separate on purpose (docs/frontend-guideline.md, "Forms").

const RIAL_PER_TOMAN = 10;
/** The pill that means «no place yet»: radios hold strings, and the API's `null` has none. */
export const NO_PLACE = "none";
/** Rial in the API, Toman in the form. */
const MIN_PRICE_TOMAN = COURSE_MIN_PRICE / RIAL_PER_TOMAN;
const MAX_PRICE_TOMAN = COURSE_MAX_PRICE / RIAL_PER_TOMAN;

/*===== Parsing =====*/
/** Digits only after folding Persian digits and dropping the separators people type inside a number. */
function wholeNumberText(raw: string): string {
  return toLatinDigits(raw).replace(/[\s,٬،]/g, "");
}

/** The number a field holds, or null while it is empty or not a whole number. Used by the live preview and echoes. */
export function parseWholeNumber(raw: string): number | null {
  const text = wholeNumberText(raw);
  return /^\d{1,15}$/.test(text) ? Number(text) : null;
}

/** One item per line as typed: trimmed, blank lines dropped (the server does the same). */
export function splitLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** An empty field is «no value» (null); anything else must be a whole number in range. */
function optionalWholeNumber({ message, min, max }: { message: string; min: number; max: number }) {
  return z.string().transform((raw, context) => {
    const text = wholeNumberText(raw);
    if (text === "") return null;
    const value = /^\d{1,15}$/.test(text) ? Number(text) : Number.NaN;
    if (Number.isNaN(value) || value < min || value > max) {
      context.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return value;
  });
}

/** Lines are checked as a list, so the message sits on the field and not on «highlights.3». */
function linesField({ label, maxLines }: { label: string; maxLines: number }) {
  return z
    .string()
    .transform(splitLines)
    .refine((lines) => lines.length <= maxLines, `${label} حداکثر ${formatNumberFa(maxLines)} خط می‌تونه باشه.`)
    .refine(
      (lines) => lines.every((line) => line.length <= COURSE_LINE_MAX_LENGTH),
      `هر خط ${label} حداکثر ${formatNumberFa(COURSE_LINE_MAX_LENGTH)} حرف می‌تونه باشه.`,
    );
}

function priceField(label: string) {
  return optionalWholeNumber({
    message: `${label} رو با عدد بنویس، بین ${formatNumberFa(MIN_PRICE_TOMAN)} و ${formatNumberFa(MAX_PRICE_TOMAN)} تومان.`,
    min: MIN_PRICE_TOMAN,
    max: MAX_PRICE_TOMAN,
  });
}

/** An optional English text: blank is "not written yet" (the English pages then show the Persian). */
function optionalTextField({ label, max }: { label: string; max: number }) {
  return z
    .string()
    .trim()
    .max(max, `${label} حداکثر ${formatNumberFa(max)} حرف می‌تونه باشه.`);
}

const COVER_REQUIRED_MESSAGE = "یه عکس برای دوره بذار.";
const SLUG_MESSAGE = `نشانی فقط حرف کوچیک انگلیسی، رقم و خط تیره می‌گیره و باید ${formatNumberFa(COURSE_SLUG_MIN_LENGTH)} تا ${formatNumberFa(COURSE_SLUG_MAX_LENGTH)} نویسه باشه.`;

/*===== Schema =====*/
/**
 * `isNew` adds what only a new course has: its address (an edited course keeps the one it has) and the cover, which an
 * edit may leave as it is.
 */
export function createCourseFormSchema({ isNew }: { isNew: boolean }) {
  return z
    .object({
      title: z
        .string()
        .trim()
        .min(1, "نام دوره رو بنویس.")
        .max(COURSE_TITLE_MAX_LENGTH, `نام دوره حداکثر ${formatNumberFa(COURSE_TITLE_MAX_LENGTH)} حرف می‌تونه باشه.`),
      latinName: z
        .string()
        .trim()
        .min(1, "نام لاتین رو بنویس.")
        .max(COURSE_TITLE_MAX_LENGTH, `نام لاتین حداکثر ${formatNumberFa(COURSE_TITLE_MAX_LENGTH)} حرف می‌تونه باشه.`),
      slug: isNew
        ? z
            .string()
            .trim()
            .min(COURSE_SLUG_MIN_LENGTH, SLUG_MESSAGE)
            .max(COURSE_SLUG_MAX_LENGTH, SLUG_MESSAGE)
            .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, SLUG_MESSAGE)
        : z.string(),
      family: z.enum(SELLABLE_COURSE_FAMILIES, "خانواده‌ی دوره رو انتخاب کن."),
      summary: z
        .string()
        .trim()
        .min(1, "توضیح کوتاه رو بنویس.")
        .max(
          COURSE_SUMMARY_MAX_LENGTH,
          `توضیح کوتاه حداکثر ${formatNumberFa(COURSE_SUMMARY_MAX_LENGTH)} حرف می‌تونه باشه.`,
        ),
      coverMediaId: isNew ? z.string(COVER_REQUIRED_MESSAGE).min(1, COVER_REQUIRED_MESSAGE) : z.string().nullable(),
      coverAlt: z
        .string()
        .trim()
        .min(COURSE_COVER_ALT_MIN_LENGTH, "توضیح عکس رو بنویس: صحنه‌ی عکس رو توی یه جمله بگو.")
        .max(
          COURSE_COVER_ALT_MAX_LENGTH,
          `توضیح عکس حداکثر ${formatNumberFa(COURSE_COVER_ALT_MAX_LENGTH)} حرف می‌تونه باشه.`,
        ),
      minAgeMonths: optionalWholeNumber({
        message: `حداقل سن باید یه عدد کامل بین ${formatNumberFa(0)} تا ${formatNumberFa(COURSE_MAX_AGE_MONTHS)} ماه باشه.`,
        min: 0,
        max: COURSE_MAX_AGE_MONTHS,
      }),
      maxAgeMonths: optionalWholeNumber({
        message: `حداکثر سن باید یه عدد کامل بین ${formatNumberFa(0)} تا ${formatNumberFa(COURSE_MAX_AGE_MONTHS)} ماه باشه.`,
        min: 0,
        max: COURSE_MAX_AGE_MONTHS,
      }),
      sessionCount: optionalWholeNumber({
        message: `تعداد جلسه‌ها باید یه عدد کامل بین ${formatNumberFa(1)} تا ${formatNumberFa(COURSE_MAX_SESSIONS)} باشه.`,
        min: 1,
        max: COURSE_MAX_SESSIONS,
      }),
      place: z.enum([...COURSE_PLACES, NO_PLACE]).transform((value) => (value === NO_PLACE ? null : value)),
      price: priceField("قیمت"),
      boardingPrice: priceField("قیمت نگهداری"),
      prerequisites: z
        .array(z.string())
        .max(COURSE_MAX_PREREQUISITES, `حداکثر ${formatNumberFa(COURSE_MAX_PREREQUISITES)} پیش‌نیاز می‌شه گذاشت.`),
      highlights: linesField({ label: "نتیجه‌ها", maxLines: COURSE_HIGHLIGHTS_MAX_LINES }),
      commands: linesField({ label: "فرمان‌ها", maxLines: COURSE_COMMANDS_MAX_LINES }),
      // The English text of the `/en` pages, all optional (docs/i18n/english-version-plan.md, step 9).
      titleEn: optionalTextField({ label: "نام انگلیسی", max: COURSE_TITLE_MAX_LENGTH }),
      summaryEn: optionalTextField({ label: "توضیح کوتاه انگلیسی", max: COURSE_SUMMARY_MAX_LENGTH }),
      coverAltEn: optionalTextField({ label: "توضیح انگلیسی عکس", max: COURSE_COVER_ALT_MAX_LENGTH }),
      highlightsEn: linesField({ label: "نتیجه‌های انگلیسی", maxLines: COURSE_HIGHLIGHTS_MAX_LINES }),
      commandsEn: linesField({ label: "فرمان‌های انگلیسی", maxLines: COURSE_COMMANDS_MAX_LINES }),
    })
    .superRefine(
      (value, context) => {
        // `typeof` and not `!== null`: with `when` below this also runs while other fields are wrong, and then only
        // the two ages are known to have parsed.
        const { minAgeMonths, maxAgeMonths } = value;
        if (typeof minAgeMonths === "number" && typeof maxAgeMonths === "number" && minAgeMonths > maxAgeMonths) {
          context.addIssue({
            code: "custom",
            path: ["maxAgeMonths"],
            message: "حداکثر سن نمی‌تونه از حداقل سن کمتر باشه.",
          });
        }
      },
      {
        // Zod skips an object's refinement while any field has failed, so the age order would only be told after
        // everything else was fixed. It runs whenever both ages parsed, so every message shows on the first submit.
        when: (payload) =>
          !payload.issues.some((issue) => issue.path?.[0] === "minAgeMonths" || issue.path?.[0] === "maxAgeMonths"),
      },
    );
}

export type CourseFormInput = z.input<ReturnType<typeof createCourseFormSchema>>;
export type CourseFormValues = z.output<ReturnType<typeof createCourseFormSchema>>;

/*===== To the API =====*/
/**
 * The body `course.admin.create` and `update` take, minus the cover (the caller adds `coverMediaId` the way each
 * procedure wants it). The Toman the Admin typed becomes Rial here and nowhere else.
 */
export function toCourseInput({ values, slug }: { values: CourseFormValues; slug: string }): CourseInput & {
  slug: string;
} {
  return {
    slug,
    title: values.title,
    latinName: values.latinName,
    family: values.family,
    summary: values.summary,
    highlights: values.highlights,
    commands: values.commands,
    coverAlt: values.coverAlt,
    minAgeMonths: values.minAgeMonths,
    maxAgeMonths: values.maxAgeMonths,
    sessionCount: values.sessionCount,
    place: values.place,
    price: values.price === null ? null : values.price * RIAL_PER_TOMAN,
    boardingPrice: values.boardingPrice === null ? null : values.boardingPrice * RIAL_PER_TOMAN,
    prerequisites: values.prerequisites,
    titleEn: values.titleEn,
    summaryEn: values.summaryEn,
    highlightsEn: values.highlightsEn,
    commandsEn: values.commandsEn,
    coverAltEn: values.coverAltEn,
  };
}

/*===== From a Course =====*/
const optionalDigits = (value: number | null) => (value === null ? "" : toPersianDigits(String(value)));

/** The form's starting values: empty for a new course, the course's own (Rial shown as Toman) when editing. */
export function toFormDefaults(course: AdminCourse | null): DefaultValues<CourseFormInput> {
  if (!course) {
    return {
      title: "",
      latinName: "",
      slug: "",
      // Unset on purpose: a family is a choice, never a default.
      family: undefined,
      summary: "",
      coverMediaId: "",
      coverAlt: "",
      minAgeMonths: "",
      maxAgeMonths: "",
      sessionCount: "",
      place: NO_PLACE,
      price: "",
      boardingPrice: "",
      prerequisites: [],
      highlights: "",
      commands: "",
      titleEn: "",
      summaryEn: "",
      coverAltEn: "",
      highlightsEn: "",
      commandsEn: "",
    };
  }

  return {
    title: course.title,
    latinName: course.latinName,
    slug: course.slug,
    // A course in the dropped `behavior` family shows no pill ticked, so the Admin picks one before saving.
    family: (SELLABLE_COURSE_FAMILIES as readonly string[]).includes(course.family)
      ? (course.family as (typeof SELLABLE_COURSE_FAMILIES)[number])
      : undefined,
    summary: course.summary,
    coverMediaId: null,
    coverAlt: course.cover.alt,
    minAgeMonths: optionalDigits(course.minAgeMonths),
    maxAgeMonths: optionalDigits(course.maxAgeMonths),
    sessionCount: optionalDigits(course.sessionCount),
    place: course.place ?? NO_PLACE,
    price: optionalDigits(course.price === null ? null : course.price / RIAL_PER_TOMAN),
    boardingPrice: optionalDigits(course.boardingPrice === null ? null : course.boardingPrice / RIAL_PER_TOMAN),
    prerequisites: course.prerequisites.map((required) => required.slug),
    highlights: course.highlights.join("\n"),
    commands: course.commands.join("\n"),
    titleEn: course.english.title ?? "",
    summaryEn: course.english.summary ?? "",
    coverAltEn: course.english.coverAlt ?? "",
    highlightsEn: (course.english.highlights ?? []).join("\n"),
    commandsEn: (course.english.commands ?? []).join("\n"),
  };
}

/*===== Slug =====*/
/** «House manner» → `house-manner`: the address a new course starts with, until the Admin edits it. */
export function slugFromLatinName(latinName: string): string {
  return latinName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, COURSE_SLUG_MAX_LENGTH)
    .replace(/-+$/, "");
}

/*===== Server Fields =====*/
/** The server's field names that don't match the form's. Everything else it names is a form field of that name. */
export const SERVER_FIELD_TO_FORM: Record<string, keyof CourseFormInput> = {
  cover: "coverMediaId",
};

export const FORM_FIELD_NAMES = new Set<string>([
  "slug",
  "title",
  "latinName",
  "family",
  "summary",
  "coverAlt",
  "minAgeMonths",
  "maxAgeMonths",
  "sessionCount",
  "place",
  "price",
  "boardingPrice",
  "prerequisites",
  "highlights",
  "commands",
  "titleEn",
  "summaryEn",
  "coverAltEn",
  "highlightsEn",
  "commandsEn",
]);
