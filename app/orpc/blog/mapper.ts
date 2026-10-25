import { readingMinutes, type BlogBlock, type BlogBody, type BlogFigure } from "~/lib/blog-body";
import { mediaUrl } from "~/lib/storage.server";
import { isBlogCategory, isBlogStatus } from "~/orpc/blog/constants";
import type { AdminBlogPost, AdminBlogRow, BlogCard, BlogCover, BlogPost } from "~/orpc/blog/contract";
import type { BlogPostRecord, BlogPostRow, RelatedCourseRow } from "~/orpc/blog/repository";
import type { Locale } from "~/paraglide/runtime";

/*===== Images =====*/
/** Every size of a `post` cover. */
function coverUrls(mediaId: string): BlogCover["urls"] {
  const url = (variant: string) => mediaUrl({ kind: "post", mediaId, variant });
  return { thumb: url("thumb"), card: url("card"), hero: url("hero"), og: url("og") };
}

/**
 * The body with its figures' addresses, built here from the media id so a stored body never holds a URL (the media
 * address differs between development and production).
 */
export function withFigureUrls(body: BlogBody): BlogBody {
  return { root: { type: "root", children: body.root.children.map(withFigureUrl) } };
}

function withFigureUrl(block: BlogBlock): BlogBlock {
  if (block.type !== "figure") return block;
  return {
    ...block,
    src: mediaUrl({ kind: "figure", mediaId: block.mediaId, variant: "inline" }),
    fullSrc: mediaUrl({ kind: "figure", mediaId: block.mediaId, variant: "full" }),
  } satisfies BlogFigure;
}

/*===== Language =====*/
/** The post's text in `locale`. Only posts with English reach the English pages, so there is no Persian fallback. */
function textIn({ post, locale }: { post: BlogPostRow; locale: Locale }) {
  const english = locale === "en" && post.hasEnglish;
  return {
    title: english ? (post.titleEn ?? post.title) : post.title,
    excerpt: english ? (post.excerptEn ?? post.excerpt) : post.excerpt,
    body: ((english ? post.bodyEn : post.body) ?? post.body) as BlogBody,
    coverAlt: english ? (post.coverAltEn ?? post.coverAlt) : post.coverAlt,
    wordCount: english ? (post.wordCountEn ?? post.wordCount) : post.wordCount,
  };
}

/*===== Public =====*/
/**
 * A published post's card in `locale`.
 *
 * @throws When the post has no cover or publish time: publishing requires both, so this is corrupted data.
 */
export function toBlogCard({ record, locale }: { record: BlogPostRecord; locale: Locale }): BlogCard {
  const { post, coverPlaceholder } = record;
  if (!post.coverMediaId || !post.publishedAt) throw new Error(`Published post ${post.id} has no cover or date`);
  const text = textIn({ post, locale });

  return {
    slug: post.slug,
    title: text.title,
    excerpt: text.excerpt,
    // A category removed from the list later reads as the most general one instead of taking the list down.
    category: isBlogCategory(post.category) ? post.category : "training",
    cover: { alt: text.coverAlt, placeholder: coverPlaceholder ?? "", urls: coverUrls(post.coverMediaId) },
    publishedAt: post.publishedAt,
    readingMinutes: readingMinutes(text.wordCount),
  };
}

/** The closing card's course in `locale`, Persian where its English isn't written. */
export function toRelatedCourse({ course, locale }: { course: RelatedCourseRow; locale: Locale }) {
  const english = locale === "en";
  const pick = (fa: string, en: string | null) => (english && en && en.trim() !== "" ? en : fa);
  return {
    slug: course.slug,
    title: pick(course.title, course.titleEn),
    summary: pick(course.summary, course.summaryEn),
    cover: {
      src: course.coverImage,
      alt: pick(course.coverAlt, course.coverAltEn),
      width: course.coverWidth,
      height: course.coverHeight,
    },
  };
}

export function toBlogPost({
  record,
  locale,
  relatedCourse,
}: {
  record: BlogPostRecord;
  locale: Locale;
  relatedCourse: RelatedCourseRow | undefined;
}): BlogPost {
  const text = textIn({ post: record.post, locale });
  return {
    ...toBlogCard({ record, locale }),
    body: withFigureUrls(text.body),
    updatedAt: record.post.updatedAt,
    hasEnglish: record.post.hasEnglish,
    // A course taken off sale drops out of the card; the article then offers a free evaluation.
    relatedCourse: relatedCourse?.status === "approved" ? toRelatedCourse({ course: relatedCourse, locale }) : null,
  };
}

/*===== Admin =====*/
function adminStatus(value: string) {
  // An unknown stored status reads as a draft: not public, and the Admin can still open and fix it.
  return isBlogStatus(value) ? value : "draft";
}

export function toAdminBlogRow({ post }: BlogPostRecord): AdminBlogRow {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    status: adminStatus(post.status),
    category: isBlogCategory(post.category) ? post.category : "training",
    hasEnglish: post.hasEnglish,
    wordCount: post.wordCount,
    coverThumb: post.coverMediaId ? coverUrls(post.coverMediaId).thumb : null,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
  };
}

export function toAdminBlogPost({
  record,
  relatedCourseSlug,
}: {
  record: BlogPostRecord;
  relatedCourseSlug: string | null;
}): AdminBlogPost {
  const { post, coverPlaceholder } = record;
  return {
    id: post.id,
    slug: post.slug,
    previousSlugs: post.previousSlugs,
    status: adminStatus(post.status),
    category: isBlogCategory(post.category) ? post.category : "training",
    title: post.title,
    excerpt: post.excerpt,
    body: withFigureUrls(post.body as BlogBody),
    coverAlt: post.coverAlt,
    cover: post.coverMediaId
      ? { mediaId: post.coverMediaId, placeholder: coverPlaceholder ?? "", urls: coverUrls(post.coverMediaId) }
      : null,
    relatedCourseSlug,
    english: {
      title: post.titleEn,
      excerpt: post.excerptEn,
      body: post.bodyEn ? withFigureUrls(post.bodyEn as BlogBody) : null,
      coverAlt: post.coverAltEn,
    },
    hasEnglish: post.hasEnglish,
    wordCount: post.wordCount,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
  };
}
