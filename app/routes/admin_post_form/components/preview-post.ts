import {
  bodyText,
  countWords,
  emptyBody,
  normalizeBody,
  readingMinutes,
  type BlogBlock,
  type BlogBody,
} from "~/lib/blog-body";
import type { AdminBlogPost, BlogPost } from "~/orpc/blog/contract";
import type { AdminCourse } from "~/orpc/course/contract";
import type { Media } from "~/orpc/media/contract";
import type { PostFormInput } from "~/routes/admin_post_form/schema";

/*===== Constants =====*/
/** A cover's stand-in while a draft has none: the card's grey at 16:9, so the article's header keeps its shape. */
const NO_COVER = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#232323"/></svg>',
)}`;

/*===== Body =====*/
/** A figure's text field from the editor's JSON, or undefined when it is missing or blank. */
function readText(raw: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = raw?.[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

/** A figure's size from the editor's JSON, or undefined when it is missing or zero. */
function readSize(raw: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = raw?.[key];
  return typeof value === "number" && value > 0 ? value : undefined;
}

/**
 * A body as the article will draw it, from the editor's JSON: `normalizeBody`'s stored form (so the preview shows
 * exactly what the server keeps) with each figure's picture put back, since the stored form keeps only the author's
 * fields. Blocks map one to one, so the n-th figure of the raw JSON is the n-th of the result.
 */
export function previewBody(json: unknown): BlogBody {
  const normalized = normalizeBody(json);
  if (!normalized.ok) return emptyBody();

  const rawChildren = (json as { root?: { children?: unknown[] } }).root?.children ?? [];
  const rawFigures = rawChildren.filter(
    (child): child is Record<string, unknown> =>
      typeof child === "object" && child !== null && (child as { type?: unknown }).type === "figure",
  );
  let figureIndex = 0;

  return {
    root: {
      type: "root",
      children: normalized.body.root.children.map((block): BlogBlock => {
        if (block.type !== "figure") return block;
        const raw = rawFigures[figureIndex++];
        return {
          ...block,
          src: readText(raw, "src"),
          fullSrc: readText(raw, "fullSrc") ?? readText(raw, "src"),
          width: readSize(raw, "width"),
          height: readSize(raw, "height"),
          placeholder: readText(raw, "placeholder"),
        };
      }),
    },
  };
}

/** The words of a body as the server counts them, 0 for one the editor hasn't made valid. */
export function bodyWordCount(json: unknown): number {
  const normalized = normalizeBody(json);
  return normalized.ok ? countWords(bodyText(normalized.body)) : 0;
}

/** Whether a body has anything in it: words or an image (an untouched English sheet has neither). */
export function bodyIsWritten(json: unknown): boolean {
  const normalized = normalizeBody(json);
  if (!normalized.ok) return json !== null && json !== undefined;
  return (
    normalized.body.root.children.some((block) => block.type === "figure") || countWords(bodyText(normalized.body)) > 0
  );
}

/**
 * A stable fingerprint of a body's content, for «is there something to save»: the stored form without blank text
 * blocks, so the empty paragraph Lexical keeps in an empty sheet, or the fields only the editor adds, never count as
 * an edit. A body the editor hasn't made valid always differs.
 */
export function bodyFingerprint(json: unknown): string {
  if (json === null || json === undefined) return "[]";
  const normalized = normalizeBody(json);
  if (!normalized.ok) return `invalid:${JSON.stringify(json).length}:${Math.random()}`;
  const blocks = normalized.body.root.children.filter(
    (block) =>
      block.type === "figure" ||
      block.type === "list" ||
      countWords(bodyText({ root: { type: "root", children: [block] } })) > 0,
  );
  return JSON.stringify(blocks);
}

/*===== Preview Post =====*/
/**
 * The `BlogPost` the article template renders in the preview, built from the form's unsaved values: the cover just
 * uploaded or the saved one, the publish date (now for a post never published), the reading time from the words as
 * typed, and the closing course from the course list (null when none is chosen or it isn't on sale, as the public
 * page does). In `en`, the English fields with the Persian standing in for any not written yet.
 */
export function buildPreviewPost({
  values,
  post,
  uploadedCover,
  courses,
  language,
}: {
  values: Partial<PostFormInput>;
  post: AdminBlogPost | null;
  uploadedCover: Media | null;
  courses: AdminCourse[];
  language: "fa" | "en";
}): BlogPost {
  const english = language === "en";
  const pick = (fa: string | undefined, en: string | undefined) =>
    english && en && en.trim() !== "" ? en.trim() : (fa ?? "").trim();

  /*------ Cover ------*/
  const urls = uploadedCover
    ? {
        thumb: uploadedCover.urls.thumb ?? NO_COVER,
        card: uploadedCover.urls.card ?? NO_COVER,
        hero: uploadedCover.urls.hero ?? NO_COVER,
        og: uploadedCover.urls.og ?? NO_COVER,
      }
    : (post?.cover?.urls ?? { thumb: NO_COVER, card: NO_COVER, hero: NO_COVER, og: NO_COVER });
  const placeholder = uploadedCover?.placeholder ?? post?.cover?.placeholder ?? "";

  /*------ Body ------*/
  const rawBody = english && bodyIsWritten(values.bodyEn) ? values.bodyEn : values.body;
  const body = previewBody(rawBody ?? emptyBody());

  /*------ Course ------*/
  const course = courses.find((candidate) => candidate.slug === values.relatedCourseSlug);
  const relatedCourse =
    course && course.status === "approved"
      ? {
          slug: course.slug,
          title: pick(course.title, course.english.title ?? undefined),
          summary: pick(course.summary, course.english.summary ?? undefined),
          cover: {
            src: course.cover.src,
            alt: pick(course.cover.alt, course.english.coverAlt ?? undefined),
            width: course.cover.width,
            height: course.cover.height,
          },
        }
      : null;

  return {
    slug: (values.slug ?? "").trim() || post?.slug || "preview",
    title: pick(values.title, values.titleEn) || "بدون عنوان",
    excerpt: pick(values.excerpt, values.excerptEn),
    category: values.category ?? post?.category ?? "training",
    cover: { alt: pick(values.coverAlt, values.coverAltEn), placeholder, urls },
    publishedAt: post?.publishedAt ?? new Date(),
    updatedAt: new Date(),
    readingMinutes: readingMinutes(countWords(bodyText(body))),
    body,
    hasEnglish: false,
    relatedCourse,
  };
}
