import { oc } from "@orpc/contract";
import { z } from "zod";

import type { BlogBody } from "~/lib/blog-body";
import { BLOG_CATEGORIES, BLOG_QUERY_MAX_LENGTH, BLOG_STATUSES } from "~/orpc/blog/constants";
import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
/** A body as `app/lib/blog-body.ts` describes it. Only the server writes it, after `normalizeBody`. */
const bodySchema = z.custom<BlogBody>((value) => typeof value === "object" && value !== null && "root" in value);

/**
 * A cover's every size, at the fixed boxes of the `post` media kind (`MEDIA_VARIANTS.post`): `thumb` 480×270, `card`
 * 960×540, `hero` 1920×823, `og` 1200×630.
 */
export const blogCoverSchema = z.object({
  alt: z.string(),
  placeholder: z.string(),
  urls: z.object({ thumb: z.string(), card: z.string(), hero: z.string(), og: z.string() }),
});

export type BlogCover = z.infer<typeof blogCoverSchema>;

/** A published post on the blog's list, in the page's language. */
export const blogCardSchema = z.object({
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  category: z.enum(BLOG_CATEGORIES),
  cover: blogCoverSchema,
  publishedAt: z.date(),
  readingMinutes: z.number().int(),
});

export type BlogCard = z.infer<typeof blogCardSchema>;

/** The course an article's closing card points to, in the page's language. Only a course on sale is shown. */
export const blogRelatedCourseSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  cover: z.object({ src: z.string(), alt: z.string(), width: z.number().int(), height: z.number().int() }),
});

/**
 * A published post, in the page's language. The body's figures carry `src` (the `inline` size) and `fullSrc`, and its
 * H2s are numbered as `headingId` says. `hasEnglish` says whether `/en/blog/<slug>` exists, for the alternate-language
 * links and the language switch.
 */
export const blogPostSchema = blogCardSchema.extend({
  body: bodySchema,
  updatedAt: z.date(),
  hasEnglish: z.boolean(),
  relatedCourse: blogRelatedCourseSchema.nullable(),
});

export type BlogPost = z.infer<typeof blogPostSchema>;

/** A post, or the slug it moved to (an old address answers with a permanent redirect). */
export const blogLookupSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("post"), post: blogPostSchema }),
  z.object({ kind: z.literal("moved"), slug: z.string() }),
]);

/*===== Admin Schemas =====*/
/** A post on the Admin's list. */
export const adminBlogRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  status: z.enum(BLOG_STATUSES),
  category: z.enum(BLOG_CATEGORIES),
  hasEnglish: z.boolean(),
  wordCount: z.number().int(),
  /** The `thumb` cover, or null while a draft has none. */
  coverThumb: z.string().nullable(),
  publishedAt: z.date().nullable(),
  updatedAt: z.date(),
});

export type AdminBlogRow = z.infer<typeof adminBlogRowSchema>;

/**
 * A post as the Admin's form edits it: everything as stored (Persian and English), any status. Bodies come with their
 * figures' `src`, so the editor and the preview show them.
 */
export const adminBlogPostSchema = z.object({
  id: z.string(),
  slug: z.string(),
  /** Earlier published addresses that redirect here. */
  previousSlugs: z.array(z.string()),
  status: z.enum(BLOG_STATUSES),
  category: z.enum(BLOG_CATEGORIES),
  title: z.string(),
  excerpt: z.string(),
  body: bodySchema,
  coverAlt: z.string(),
  /** Null while a draft has no cover. */
  cover: z.object({ mediaId: z.string(), placeholder: z.string(), urls: blogCoverSchema.shape.urls }).nullable(),
  relatedCourseSlug: z.string().nullable(),
  english: z.object({
    title: z.string().nullable(),
    excerpt: z.string().nullable(),
    body: bodySchema.nullable(),
    coverAlt: z.string().nullable(),
  }),
  hasEnglish: z.boolean(),
  wordCount: z.number().int(),
  publishedAt: z.date().nullable(),
  updatedAt: z.date(),
});

export type AdminBlogPost = z.infer<typeof adminBlogPostSchema>;

/**
 * What the post form sends, as typed. The bodies are the editor's JSON (`editorState.toJSON()`); the server keeps only
 * what `normalizeBody` allows. `coverMediaId` is a `post` image from `media.upload`: absent or blank keeps the current
 * cover. The English fields are all optional: blank is "not written", and the English page exists only when all four
 * are written.
 */
export const blogInputSchema = z.strictObject({
  slug: z.string(),
  category: z.string(),
  title: z.string(),
  excerpt: z.string(),
  body: z.unknown(),
  coverMediaId: z.string().optional(),
  coverAlt: z.string(),
  relatedCourseSlug: z.string().nullable(),
  titleEn: z.string().optional(),
  excerptEn: z.string().optional(),
  bodyEn: z.unknown().optional(),
  coverAltEn: z.string().optional(),
});

export type BlogInput = z.infer<typeof blogInputSchema>;

/*===== Errors =====*/
// Maps to HTTP 404 through oRPC's default status map.
const blogErrors = {
  NOT_FOUND: {
    message: "Post not found.",
    data: errorDataSchema,
  },
};

/*===== Procedures =====*/
/** Published posts, newest first. `q` matches title, excerpt and text however Persian was typed (`normalizeForSearch`). */
export const listBlogPostsContract = oc
  .errors(commonErrors)
  .input(
    z.strictObject({
      category: z.enum(BLOG_CATEGORIES).optional(),
      q: z.string().max(BLOG_QUERY_MAX_LENGTH).optional(),
    }),
  )
  .output(z.array(blogCardSchema));

/** A published post by its address, or where an old address moved to. On `/en`, only a post with English text. */
export const getBlogPostContract = oc
  .errors({ ...commonErrors, ...blogErrors })
  .input(z.strictObject({ slug: z.string() }))
  .output(blogLookupSchema);

/*===== Admin Procedures =====*/
const adminErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/** Every post, drafts too, most recently changed first. */
export const adminListBlogPostsContract = oc.errors(adminErrors).output(z.array(adminBlogRowSchema));

export const adminGetBlogPostContract = oc
  .errors({ ...adminErrors, ...blogErrors })
  .input(z.strictObject({ id: z.string() }))
  .output(adminBlogPostSchema);

/**
 * A new draft. Refusals are `INVALID_INPUT` with `fields.<name>` (`slug`, `category`, `title`, `excerpt`, `body`,
 * `cover`, `coverAlt`, `relatedCourseSlug`, `titleEn`, `excerptEn`, `bodyEn`, `coverAltEn`).
 */
export const adminCreateBlogPostContract = oc
  .errors(adminErrors)
  .input(blogInputSchema)
  .output(adminBlogPostSchema);

/**
 * Rewrites a post. A published post stays published, so it must still pass what publishing needs. Changing the slug of
 * a post that was ever published keeps the old one as a redirect.
 */
export const adminUpdateBlogPostContract = oc
  .errors({ ...adminErrors, ...blogErrors })
  .input(blogInputSchema.extend({ id: z.string() }))
  .output(adminBlogPostSchema);

/**
 * Publishes or unpublishes. Publishing an unfinished post is `INVALID_INPUT` with the fields to finish. Idempotent.
 */
export const adminSetBlogPostStatusContract = oc
  .errors({ ...adminErrors, ...blogErrors })
  .input(z.strictObject({ id: z.string(), status: z.enum(BLOG_STATUSES) }))
  .output(adminBlogPostSchema);

/** Deletes a post for good: its address and old addresses answer 404. */
export const adminDeleteBlogPostContract = oc
  .errors({ ...adminErrors, ...blogErrors })
  .input(z.strictObject({ id: z.string() }))
  .output(z.object({ id: z.string() }));

export const blogContract = {
  list: listBlogPostsContract,
  get: getBlogPostContract,
  admin: {
    list: adminListBlogPostsContract,
    get: adminGetBlogPostContract,
    create: adminCreateBlogPostContract,
    update: adminUpdateBlogPostContract,
    setStatus: adminSetBlogPostStatusContract,
    delete: adminDeleteBlogPostContract,
  },
};
