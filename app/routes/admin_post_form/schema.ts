import type { DefaultValues } from "react-hook-form";
import { z } from "zod";

import { emptyBody } from "~/lib/blog-body";
import { formatNumberFa } from "~/lib/digits";
import { BLOG_CATEGORIES } from "~/orpc/blog/constants";
import type { AdminBlogPost, BlogInput } from "~/orpc/blog/contract";
import {
  BLOG_COVER_ALT_MAX_LENGTH,
  BLOG_EXCERPT_MAX_LENGTH,
  BLOG_SLUG_MAX_LENGTH,
  BLOG_SLUG_MIN_LENGTH,
  BLOG_TITLE_MAX_LENGTH,
} from "~/orpc/blog/validation";

/*===== Post Form =====*/
// Written for the person filling it in. A draft may be unfinished, so the form asks only what any save needs (a title,
// an address, a section) and leaves what publishing needs to the server, which names it field by field
// (`app/orpc/blog/service.ts`, `publishProblems`). The two are kept separate on purpose (docs/frontend-guideline.md,
// "Forms").

const SLUG_MESSAGE = `نشانی فقط حرف کوچیک انگلیسی، رقم و خط تیره می‌گیره و باید ${formatNumberFa(BLOG_SLUG_MIN_LENGTH)} تا ${formatNumberFa(BLOG_SLUG_MAX_LENGTH)} نویسه باشه.`;

function maxMessage({ label, max }: { label: string; max: number }) {
  return `${label} حداکثر ${formatNumberFa(max)} حرف می‌تونه باشه.`;
}

/** A trimmed text with a ceiling; blank is fine (a draft, or English not written yet). */
function textField({ label, max }: { label: string; max: number }) {
  return z.string().trim().max(max, maxMessage({ label, max }));
}

/*===== Schema =====*/
export const postFormSchema = z.object({
  /*------ Text ------*/
  title: z
    .string()
    .trim()
    .min(1, "عنوان نوشته رو بنویس.")
    .max(BLOG_TITLE_MAX_LENGTH, maxMessage({ label: "عنوان", max: BLOG_TITLE_MAX_LENGTH })),
  excerpt: textField({ label: "خلاصه", max: BLOG_EXCERPT_MAX_LENGTH }),
  /** The editor's JSON (`editorState.toJSON()`); the server keeps only what `normalizeBody` allows. */
  body: z.unknown(),

  /*------ Cover ------*/
  /** A `post` image uploaded in this visit; null keeps the saved cover. */
  coverMediaId: z.string().nullable(),
  coverAlt: textField({ label: "توضیح عکس", max: BLOG_COVER_ALT_MAX_LENGTH }),

  /*------ Details ------*/
  slug: z
    .string()
    .trim()
    .min(BLOG_SLUG_MIN_LENGTH, SLUG_MESSAGE)
    .max(BLOG_SLUG_MAX_LENGTH, SLUG_MESSAGE)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, SLUG_MESSAGE),
  category: z.enum(BLOG_CATEGORIES, "بخش نوشته رو انتخاب کن."),
  /** "" is no course: the article then closes with the free evaluation. */
  relatedCourseSlug: z.string(),

  /*------ English ------*/
  titleEn: textField({ label: "عنوان انگلیسی", max: BLOG_TITLE_MAX_LENGTH }),
  excerptEn: textField({ label: "خلاصه‌ی انگلیسی", max: BLOG_EXCERPT_MAX_LENGTH }),
  coverAltEn: textField({ label: "توضیح انگلیسی عکس", max: BLOG_COVER_ALT_MAX_LENGTH }),
  bodyEn: z.unknown(),
});

export type PostFormInput = z.input<typeof postFormSchema>;
export type PostFormValues = z.output<typeof postFormSchema>;

/*===== To the API =====*/
/** The body `blog.admin.create` and `update` take. No new photo sends no `coverMediaId`, which keeps the saved one. */
export function toBlogInput(values: PostFormValues): BlogInput {
  return {
    slug: values.slug,
    category: values.category,
    title: values.title,
    excerpt: values.excerpt,
    body: values.body ?? emptyBody(),
    ...(values.coverMediaId ? { coverMediaId: values.coverMediaId } : {}),
    coverAlt: values.coverAlt,
    relatedCourseSlug: values.relatedCourseSlug || null,
    titleEn: values.titleEn,
    excerptEn: values.excerptEn,
    // An English editor left blank is "not written": the server stores null for a body with no words or images.
    bodyEn: values.bodyEn ?? null,
    coverAltEn: values.coverAltEn,
  };
}

/*===== From a Post =====*/
/** The form's starting values: empty for a new post, the post's own when editing. */
export function toFormDefaults(post: AdminBlogPost | null): DefaultValues<PostFormInput> {
  if (!post) {
    return {
      title: "",
      excerpt: "",
      body: emptyBody(),
      coverMediaId: null,
      coverAlt: "",
      slug: "",
      // Unset on purpose: a section is a choice, never a default.
      category: undefined,
      relatedCourseSlug: "",
      titleEn: "",
      excerptEn: "",
      coverAltEn: "",
      bodyEn: null,
    };
  }

  return {
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    coverMediaId: null,
    coverAlt: post.coverAlt,
    slug: post.slug,
    category: post.category,
    relatedCourseSlug: post.relatedCourseSlug ?? "",
    titleEn: post.english.title ?? "",
    excerptEn: post.english.excerpt ?? "",
    coverAltEn: post.english.coverAlt ?? "",
    bodyEn: post.english.body,
  };
}

/*===== Slug =====*/
/** «The first week with a puppy» → `the-first-week-with-a-puppy`: what a new post's address follows until she types one. */
export function slugFromEnglishTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, BLOG_SLUG_MAX_LENGTH)
    .replace(/-+$/, "");
}

/*===== Server Fields =====*/
/** The server's field names that don't match the form's. Everything else it names is a form field of that name. */
export const SERVER_FIELD_TO_FORM: Record<string, keyof PostFormInput> = {
  cover: "coverMediaId",
};

export const FORM_FIELD_NAMES = new Set<string>([
  "title",
  "excerpt",
  "body",
  "coverMediaId",
  "coverAlt",
  "slug",
  "category",
  "relatedCourseSlug",
  "titleEn",
  "excerptEn",
  "coverAltEn",
  "bodyEn",
]);

/** The form field a server field name lands on, or null when the form has no such field. */
export function formFieldFor(serverField: string): keyof PostFormInput | null {
  return (
    SERVER_FIELD_TO_FORM[serverField] ??
    (FORM_FIELD_NAMES.has(serverField) ? (serverField as keyof PostFormInput) : null)
  );
}
