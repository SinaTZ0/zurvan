import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";
import { BLOG_CATEGORIES } from "~/orpc/blog/constants";

/*===== Limits =====*/
export const BLOG_TITLE_MAX_LENGTH = 100;
export const BLOG_EXCERPT_MIN_LENGTH = 40;
/** About what a search result shows of a meta description. */
export const BLOG_EXCERPT_MAX_LENGTH = 300;
export const BLOG_COVER_ALT_MIN_LENGTH = 5;
export const BLOG_COVER_ALT_MAX_LENGTH = 200;
export const BLOG_SLUG_MIN_LENGTH = 2;
export const BLOG_SLUG_MAX_LENGTH = 80;
/** Of the body's JSON as sent. A long article with forty images is well under it. */
export const BLOG_BODY_MAX_CHARS = 400_000;

/*===== Messages =====*/
export const BLOG_SLUG_TAKEN_MESSAGE = "این نشانی رو قبلاً یه نوشته‌ی دیگه گرفته.";
export const BLOG_COVER_INVALID_MESSAGE = "عکس رو دوباره بفرست.";
export const BLOG_COVER_REQUIRED_MESSAGE = "برای انتشار، یه عکس برای نوشته بذار.";
export const BLOG_FIGURE_INVALID_MESSAGE = "یکی از عکس‌های متن پیدا نشد؛ پاکش کن و دوباره بفرستش.";
export const BLOG_BODY_TOO_LONG_MESSAGE = "متن خیلی بلنده؛ به دو نوشته تقسیمش کن.";
export const BLOG_BODY_EMPTY_MESSAGE = "برای انتشار، متن نوشته رو بنویس.";
export const BLOG_COURSE_UNKNOWN_MESSAGE = "دوره‌ی انتخاب‌شده پیدا نشد؛ صفحه رو دوباره باز کن.";

const SLUG_MESSAGE = `نشانی فقط حرف کوچیک انگلیسی، رقم و خط تیره می‌گیره و باید ${formatNumberFa(BLOG_SLUG_MIN_LENGTH)} تا ${formatNumberFa(BLOG_SLUG_MAX_LENGTH)} نویسه باشه.`;

/*===== Fields =====*/
function maxMessage(label: string, max: number) {
  return `${label} حداکثر ${formatNumberFa(max)} حرف می‌تونه باشه.`;
}

/** An optional English text: trimmed, and blank is null, "not written". */
function optionalTextSchema({ label, max }: { label: string; max: number }) {
  return z
    .string()
    .trim()
    .max(max, maxMessage(label, max))
    .optional()
    .transform((value) => (value ? value : null));
}

/*===== Post =====*/
/**
 * The post form as the service accepts it: trimming and limits. A draft may be unfinished (no excerpt, no cover, no
 * text); what publishing needs is checked by `publishProblems` in the service. The bodies are checked by
 * `normalizeBody` (`app/lib/blog-body.ts`) and what needs the database (slug, images, course) by the service.
 */
export const blogFormSchema = z.object({
  category: z.enum(BLOG_CATEGORIES, "بخش نوشته رو انتخاب کن."),
  title: z
    .string()
    .trim()
    .min(1, "عنوان نوشته رو بنویس.")
    .max(BLOG_TITLE_MAX_LENGTH, maxMessage("عنوان", BLOG_TITLE_MAX_LENGTH)),
  excerpt: z.string().trim().max(BLOG_EXCERPT_MAX_LENGTH, maxMessage("خلاصه", BLOG_EXCERPT_MAX_LENGTH)),
  coverAlt: z.string().trim().max(BLOG_COVER_ALT_MAX_LENGTH, maxMessage("توضیح عکس", BLOG_COVER_ALT_MAX_LENGTH)),
  relatedCourseSlug: z
    .string()
    .trim()
    .nullable()
    .transform((value) => (value ? value : null)),
  titleEn: optionalTextSchema({ label: "عنوان انگلیسی", max: BLOG_TITLE_MAX_LENGTH }),
  excerptEn: optionalTextSchema({ label: "خلاصه‌ی انگلیسی", max: BLOG_EXCERPT_MAX_LENGTH }),
  coverAltEn: optionalTextSchema({ label: "توضیح انگلیسی عکس", max: BLOG_COVER_ALT_MAX_LENGTH }),
});

export type BlogForm = z.output<typeof blogFormSchema>;

/*===== Slug =====*/
/** A post's address: lowercase words joined by single dashes. It can change; old published addresses redirect. */
export const blogSlugSchema = z
  .string()
  .trim()
  .min(BLOG_SLUG_MIN_LENGTH, SLUG_MESSAGE)
  .max(BLOG_SLUG_MAX_LENGTH, SLUG_MESSAGE)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, SLUG_MESSAGE);

/*===== Publishing =====*/
export const PUBLISH_MESSAGES = {
  excerpt: `برای انتشار، یه خلاصه‌ی ${formatNumberFa(BLOG_EXCERPT_MIN_LENGTH)} تا ${formatNumberFa(BLOG_EXCERPT_MAX_LENGTH)} حرفی بنویس؛ زیر عنوان و توی نتیجه‌های گوگل دیده می‌شه.`,
  coverAlt: "توضیح عکس رو بنویس: صحنه‌ی عکس رو توی یه جمله بگو.",
  english: "متن انگلیسی یا باید کامل باشه یا خالی: عنوان، خلاصه، توضیح عکس و متن.",
} as const;
