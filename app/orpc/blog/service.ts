import { z } from "zod";

import type { Database } from "~/db/client.server";
import { recordAudit } from "~/lib/audit.server";
import {
  bodyFigures,
  bodyText,
  countWords,
  emptyBody,
  normalizeBody,
  type BlogBlock,
  type BlogBody,
} from "~/lib/blog-body";
import { issuesToErrorData } from "~/lib/schema-issues";
import { normalizeForSearch } from "~/lib/search";
import type { BlogCategory, BlogStatus } from "~/orpc/blog/constants";
import type { AdminBlogPost, AdminBlogRow, BlogCard, BlogInput, BlogPost } from "~/orpc/blog/contract";
import { toAdminBlogPost, toAdminBlogRow, toBlogCard, toBlogPost } from "~/orpc/blog/mapper";
import {
  deletePostById,
  findAllPosts,
  findCourseById,
  findCourseBySlug,
  findCourseSlugs,
  findMediaByIds,
  findPostById,
  findPublishedPostByPreviousSlug,
  findPublishedPostBySlug,
  findPublishedPosts,
  insertPostOnce,
  isSlugTaken,
  updatePostById,
  updatePostStatus,
  type BlogPostRecord,
  type BlogPostValues,
} from "~/orpc/blog/repository";
import {
  BLOG_BODY_EMPTY_MESSAGE,
  BLOG_BODY_MAX_CHARS,
  BLOG_BODY_TOO_LONG_MESSAGE,
  BLOG_COURSE_UNKNOWN_MESSAGE,
  BLOG_COVER_ALT_MIN_LENGTH,
  BLOG_COVER_INVALID_MESSAGE,
  BLOG_COVER_REQUIRED_MESSAGE,
  BLOG_EXCERPT_MIN_LENGTH,
  BLOG_FIGURE_INVALID_MESSAGE,
  BLOG_SLUG_TAKEN_MESSAGE,
  PUBLISH_MESSAGES,
  blogFormSchema,
  blogSlugSchema,
} from "~/orpc/blog/validation";
import { getMediaVariantSize, getMediaVariantSpec } from "~/orpc/media/constants";
import { attachMedia, isMediaId } from "~/orpc/media/service";
import type { Locale } from "~/paraglide/runtime";

/*===== Types =====*/
type NotFoundResult = { kind: "not-found" };
type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };

const idSchema = z.guid();

/*===== Public List =====*/
/**
 * F16: published posts, newest first, in `locale`. On `en` only the posts with English text. `q` is folded like the
 * stored search text, so «ادرار هیجانی», «ادرارهیجانی» and an Arabic-keyboard spelling all find the same posts.
 */
export async function listPosts({
  db,
  locale,
  category,
  q,
}: {
  db: Database;
  locale: Locale;
  category?: BlogCategory | undefined;
  q?: string | undefined;
}): Promise<BlogCard[]> {
  const needle = q ? normalizeForSearch(q) : "";
  const records = await findPublishedPosts({ db, locale, category, needle: needle || undefined });
  return records.map((record) => toBlogCard({ record, locale }));
}

/*===== Public Get =====*/
type GetPostResult = { kind: "post"; post: BlogPost } | { kind: "moved"; slug: string } | NotFoundResult;

/**
 * F16: a published post by its address, or the address an old one moved to. A draft, an unknown address, or (on `en`)
 * a post without English text is `not-found`.
 */
export async function getPost({ db, slug, locale }: { db: Database; slug: string; locale: Locale }): Promise<GetPostResult> {
  const record = await findPublishedPostBySlug({ db, slug });
  if (record) {
    if (locale === "en" && !record.post.hasEnglish) return { kind: "not-found" };
    const relatedCourse = record.post.relatedCourseId
      ? await findCourseById({ db, id: record.post.relatedCourseId })
      : undefined;
    return { kind: "post", post: toBlogPost({ record, locale, relatedCourse }) };
  }

  const moved = await findPublishedPostByPreviousSlug({ db, slug });
  if (!moved || (locale === "en" && !moved.hasEnglish)) return { kind: "not-found" };
  return { kind: "moved", slug: moved.slug };
}

/*===== Admin Read =====*/
async function toAdmin({ db, record }: { db: Database; record: BlogPostRecord }): Promise<AdminBlogPost> {
  const courseId = record.post.relatedCourseId;
  const [course] = courseId ? await findCourseSlugs({ db, ids: [courseId] }) : [];
  return toAdminBlogPost({ record, relatedCourseSlug: course?.slug ?? null });
}

/** F16: every post, drafts too, most recently changed first. */
export async function adminListPosts({ db }: { db: Database }): Promise<AdminBlogRow[]> {
  return (await findAllPosts({ db })).map(toAdminBlogRow);
}

type AdminGetResult = { kind: "success"; post: AdminBlogPost } | NotFoundResult;

/** @returns `not-found` for an unknown or malformed id. */
export async function adminGetPost({ db, id }: { db: Database; id: string }): Promise<AdminGetResult> {
  if (!idSchema.safeParse(id).success) return { kind: "not-found" };
  const record = await findPostById({ db, id });
  if (!record) return { kind: "not-found" };
  return { kind: "success", post: await toAdmin({ db, record }) };
}

/*===== Admin Rules =====*/
/** A body with no words and no images counts as not written (an English body the Admin never touched). */
function isBlank(body: BlogBody): boolean {
  return bodyFigures(body).length === 0 && countWords(bodyText(body)) === 0;
}

/** The fields publishing needs, as messages keyed by field. Empty when the post can be public. */
function publishProblems(values: {
  excerpt?: string | undefined;
  coverMediaId?: string | null | undefined;
  coverAlt?: string | undefined;
  wordCount?: number | undefined;
  titleEn?: string | null | undefined;
  excerptEn?: string | null | undefined;
  coverAltEn?: string | null | undefined;
  bodyEn?: unknown;
  hasEnglish?: boolean | undefined;
}): Record<string, string> {
  const fields: Record<string, string> = {};
  if ((values.excerpt ?? "").length < BLOG_EXCERPT_MIN_LENGTH) fields.excerpt = PUBLISH_MESSAGES.excerpt;
  if (!values.coverMediaId) fields.cover = BLOG_COVER_REQUIRED_MESSAGE;
  if ((values.coverAlt ?? "").length < BLOG_COVER_ALT_MIN_LENGTH) fields.coverAlt = PUBLISH_MESSAGES.coverAlt;
  if (!values.wordCount) fields.body = BLOG_BODY_EMPTY_MESSAGE;

  // Half an English post would silently stay off `/en`; the Admin finishes it or clears it.
  const english = { titleEn: values.titleEn, excerptEn: values.excerptEn, coverAltEn: values.coverAltEn, bodyEn: values.bodyEn };
  const written = Object.entries(english).filter(([, value]) => value !== null && value !== undefined);
  if (written.length > 0 && !values.hasEnglish) {
    for (const [field, value] of Object.entries(english)) {
      if (value === null || value === undefined) fields[field] = PUBLISH_MESSAGES.english;
    }
  }
  return fields;
}

type PreparedPost = {
  kind: "ok";
  values: BlogPostValues;
  /** Images to mark as used once the post is saved. */
  media: { id: string; kind: "post" | "figure" }[];
};

/**
 * Checks everything the form sent and builds the row's values: the slug (and the old one kept as a redirect), the
 * bodies through the whitelist with each figure's size and placeholder written from its media row, the cover, the
 * course, the search text and word counts, and whether the English is whole. Writes nothing.
 *
 * Images are this Admin's uploads of the right kind; a client's sizes or addresses are never stored.
 */
async function preparePost({
  db,
  userId,
  input,
  existing,
}: {
  db: Database;
  userId: string;
  input: BlogInput;
  existing?: BlogPostRecord["post"];
}): Promise<PreparedPost | InvalidResult> {
  /*------ Fields ------*/
  const form = blogFormSchema.safeParse(input);
  const slug = blogSlugSchema.safeParse(input.slug);
  const issues: { message: string; path: PropertyKey[] }[] = slug.success
    ? []
    : slug.error.issues.map((issue) => ({ message: issue.message, path: ["slug"] }));
  if (!form.success) issues.push(...form.error.issues);
  const { errors, fields } = issuesToErrorData(issues);

  /*------ Bodies ------*/
  const bodies: { body?: BlogBody; bodyEn?: BlogBody | null } = {};
  for (const [field, raw] of [
    ["body", input.body ?? emptyBody()],
    ["bodyEn", input.bodyEn ?? null],
  ] as const) {
    if (raw === null) {
      bodies.bodyEn = null;
      continue;
    }
    if (JSON.stringify(raw).length > BLOG_BODY_MAX_CHARS) {
      fields[field] = BLOG_BODY_TOO_LONG_MESSAGE;
      continue;
    }
    const normalized = normalizeBody(raw);
    if (!normalized.ok) fields[field] = normalized.message;
    else if (field === "body") bodies.body = normalized.body;
    else bodies.bodyEn = isBlank(normalized.body) ? null : normalized.body;
  }

  if (!form.success || !slug.success || !bodies.body || bodies.bodyEn === undefined || Object.keys(fields).length > 0) {
    return { kind: "invalid", errors, fields };
  }
  const values = form.data;
  const body = bodies.body;
  const bodyEn = bodies.bodyEn;

  /*------ Slug ------*/
  if (await isSlugTaken({ db, slug: slug.data, exceptId: existing?.id })) fields.slug = BLOG_SLUG_TAKEN_MESSAGE;

  /*------ Cover ------*/
  const coverMediaId = input.coverMediaId?.trim() || existing?.coverMediaId || null;
  const media: PreparedPost["media"] = [];
  if (coverMediaId && coverMediaId !== existing?.coverMediaId) {
    const [cover] = isMediaId(coverMediaId) ? await findMediaByIds({ db, ids: [coverMediaId] }) : [];
    if (!cover || cover.kind !== "post" || cover.uploadedBy !== userId) fields.cover = BLOG_COVER_INVALID_MESSAGE;
    else media.push({ id: cover.id, kind: "post" });
  }

  /*------ Figures ------*/
  const figureIds = [...new Set([...bodyFigures(body), ...(bodyEn ? bodyFigures(bodyEn) : [])].map((f) => f.mediaId))];
  const figureRows = await findMediaByIds({ db, ids: figureIds.filter(isMediaId) });
  const figureById = new Map(
    figureRows.filter((row) => row.kind === "figure" && row.uploadedBy === userId).map((row) => [row.id, row]),
  );
  const inlineSpec = getMediaVariantSpec({ kind: "figure", variant: "inline" });
  if (!inlineSpec) throw new Error("preparePost: figure media has no inline variant");

  const withSizes = (target: BlogBody): BlogBody => ({
    root: {
      type: "root",
      children: target.root.children.map((block): BlogBlock => {
        if (block.type !== "figure") return block;
        const row = figureById.get(block.mediaId);
        if (!row) return block;
        const size = getMediaVariantSize({ spec: inlineSpec, mediaWidth: row.width, mediaHeight: row.height });
        return { ...block, width: size.width, height: size.height, placeholder: row.placeholder };
      }),
    },
  });
  for (const [field, target] of [["body", body], ["bodyEn", bodyEn]] as const) {
    if (target && bodyFigures(target).some((figure) => !figureById.has(figure.mediaId))) {
      fields[field] = BLOG_FIGURE_INVALID_MESSAGE;
    }
  }
  media.push(...[...figureById.keys()].map((id) => ({ id, kind: "figure" as const })));

  /*------ Course ------*/
  let relatedCourseId: string | null = null;
  if (values.relatedCourseSlug) {
    const course = await findCourseBySlug({ db, slug: values.relatedCourseSlug });
    if (!course) fields.relatedCourseSlug = BLOG_COURSE_UNKNOWN_MESSAGE;
    else relatedCourseId = course.id;
  }

  if (Object.keys(fields).length > 0) return { kind: "invalid", errors, fields };

  /*------ Values ------*/
  // An address the post had while public keeps working: it moves to `previousSlugs`, unless the Admin went back to it.
  let previousSlugs = (existing?.previousSlugs ?? []).filter((old) => old !== slug.data);
  if (existing && existing.slug !== slug.data && existing.publishedAt) {
    previousSlugs = [...new Set([...previousSlugs, existing.slug])];
  }

  const text = bodyText(body);
  const textEn = bodyEn ? bodyText(bodyEn) : null;
  const hasEnglish = Boolean(values.titleEn && values.excerptEn && values.coverAltEn && bodyEn);

  return {
    kind: "ok",
    media,
    values: {
      slug: slug.data,
      previousSlugs,
      category: values.category,
      title: values.title,
      excerpt: values.excerpt,
      body: withSizes(body),
      searchText: normalizeForSearch([values.title, values.excerpt, text].join(" ")),
      wordCount: countWords(text),
      coverMediaId,
      coverAlt: values.coverAlt,
      relatedCourseId,
      titleEn: values.titleEn,
      excerptEn: values.excerptEn,
      bodyEn: bodyEn ? withSizes(bodyEn) : null,
      coverAltEn: values.coverAltEn,
      searchTextEn: textEn === null ? null : normalizeForSearch([values.titleEn ?? "", values.excerptEn ?? "", textEn].join(" ")),
      wordCountEn: textEn === null ? null : countWords(textEn),
      hasEnglish,
    },
  };
}

/** Marks the post's images as used, so the cleanup job leaves them. A vanished image only costs the bookkeeping. */
async function attachAll({ db, userId, media }: { db: Database; userId: string; media: PreparedPost["media"] }) {
  for (const item of media) await attachMedia({ db, mediaId: item.id, kind: item.kind, userId });
}

/*===== Admin Create =====*/
type AdminWriteResult = { kind: "success"; post: AdminBlogPost } | InvalidResult;

/**
 * F16: a new draft. Every refusal is a field message and writes nothing. The slug is checked up front for the message
 * and again by the unique index, so two creates racing for it get the same message instead of an error.
 */
export async function adminCreatePost({
  db,
  userId,
  input,
}: {
  db: Database;
  userId: string;
  input: BlogInput;
}): Promise<AdminWriteResult> {
  const prepared = await preparePost({ db, userId, input });
  if (prepared.kind === "invalid") return prepared;

  const id = await insertPostOnce({ db, values: prepared.values });
  if (!id) return { kind: "invalid", errors: [], fields: { slug: BLOG_SLUG_TAKEN_MESSAGE } };
  await attachAll({ db, userId, media: prepared.media });

  const result = await adminGetPost({ db, id });
  if (result.kind !== "success") throw new Error(`adminCreatePost: post ${id} was not found after it was stored`);
  return result;
}

/*===== Admin Update =====*/
/**
 * F16: rewrites a post; its status and publish time stay. A published post must still pass what publishing needs,
 * since the change is public at once.
 *
 * @returns `not-found` for an unknown id; `invalid` with field messages, writing nothing.
 */
export async function adminUpdatePost({
  db,
  userId,
  input,
}: {
  db: Database;
  userId: string;
  input: BlogInput & { id: string };
}): Promise<AdminWriteResult | NotFoundResult> {
  const { id, ...fields } = input;
  if (!idSchema.safeParse(id).success) return { kind: "not-found" };
  const existing = await findPostById({ db, id });
  if (!existing) return { kind: "not-found" };

  const prepared = await preparePost({ db, userId, input: fields, existing: existing.post });
  if (prepared.kind === "invalid") return prepared;

  if (existing.post.status === "published") {
    const problems = publishProblems(prepared.values);
    if (Object.keys(problems).length > 0) return { kind: "invalid", errors: [], fields: problems };
  }

  await updatePostById({ db, id, values: prepared.values });
  await attachAll({ db, userId, media: prepared.media });

  const result = await adminGetPost({ db, id });
  if (result.kind !== "success") throw new Error(`adminUpdatePost: post ${id} vanished after it was saved`);
  return result;
}

/*===== Admin Set Status =====*/
/**
 * F16: publishes or unpublishes, with a line in the audit trail. The first publish sets the post's date; publishing
 * again later keeps it. Setting the status it already has changes nothing.
 *
 * @returns `invalid` with the fields to finish when an unfinished post is published.
 */
export async function adminSetPostStatus({
  db,
  userId,
  id,
  status,
}: {
  db: Database;
  userId: string;
  id: string;
  status: BlogStatus;
}): Promise<AdminWriteResult | NotFoundResult> {
  if (!idSchema.safeParse(id).success) return { kind: "not-found" };
  const record = await findPostById({ db, id });
  if (!record) return { kind: "not-found" };
  const { post } = record;

  if (post.status !== status) {
    if (status === "published") {
      const problems = publishProblems(post);
      if (Object.keys(problems).length > 0) return { kind: "invalid", errors: [], fields: problems };
    }

    await db.transaction(async (tx) => {
      await updatePostStatus({
        db: tx,
        id,
        status,
        publishedAt: status === "published" && !post.publishedAt ? new Date() : undefined,
      });
      await recordAudit({
        db: tx,
        actorId: userId,
        action: status === "published" ? "blog.published" : "blog.unpublished",
        entityType: "blog_post",
        entityId: id,
        data: { slug: post.slug },
      });
    });
  }

  const result = await adminGetPost({ db, id });
  if (result.kind !== "success") throw new Error(`adminSetPostStatus: post ${id} vanished after it was saved`);
  return result;
}

/*===== Admin Delete =====*/
/**
 * F16: deletes a post for good, with a line in the audit trail; its addresses answer 404 from then on. Its images stay
 * in the bucket (a later cleanup job's work, `app/orpc/media/service.ts`).
 */
export async function adminDeletePost({
  db,
  userId,
  id,
}: {
  db: Database;
  userId: string;
  id: string;
}): Promise<{ kind: "success" } | NotFoundResult> {
  if (!idSchema.safeParse(id).success) return { kind: "not-found" };
  const record = await findPostById({ db, id });
  if (!record) return { kind: "not-found" };

  await db.transaction(async (tx) => {
    await recordAudit({
      db: tx,
      actorId: userId,
      action: "blog.deleted",
      entityType: "blog_post",
      entityId: id,
      data: { slug: record.post.slug, title: record.post.title, status: record.post.status },
    });
    await deletePostById({ db: tx, id });
  });
  return { kind: "success" };
}
