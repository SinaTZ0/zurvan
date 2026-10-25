import { and, arrayContains, desc, eq, inArray, like, ne, or } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { blogPost, course, media } from "~/db/schema";
import type { BlogCategory, BlogStatus } from "~/orpc/blog/constants";
import type { Locale } from "~/paraglide/runtime";

/*===== Types =====*/
export type BlogPostRow = typeof blogPost.$inferSelect;

/** A stored post with its cover's placeholder (null while a draft has no cover). */
export type BlogPostRecord = { post: BlogPostRow; coverPlaceholder: string | null };

/** What the post form writes: everything but the identity, the status and the publish time. */
export type BlogPostValues = Pick<
  typeof blogPost.$inferInsert,
  | "slug"
  | "previousSlugs"
  | "category"
  | "title"
  | "excerpt"
  | "body"
  | "searchText"
  | "wordCount"
  | "coverMediaId"
  | "coverAlt"
  | "relatedCourseId"
  | "titleEn"
  | "excerptEn"
  | "bodyEn"
  | "coverAltEn"
  | "searchTextEn"
  | "wordCountEn"
  | "hasEnglish"
>;

export type MediaRow = typeof media.$inferSelect;
export type RelatedCourseRow = typeof course.$inferSelect;

/*===== Reads =====*/
function selectPosts(db: DatabaseOrTransaction) {
  return db
    .select({ post: blogPost, coverPlaceholder: media.placeholder })
    .from(blogPost)
    .leftJoin(media, eq(media.id, blogPost.coverMediaId));
}

/** `LIKE` treats `%`, `_` and the backslash as special; a visitor's text matches them literally. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Published posts, newest first. On `en`, only posts with English text, searched in it. `needle` is already folded by
 * `normalizeForSearch`, like the stored search text.
 */
export function findPublishedPosts({
  db,
  locale,
  category,
  needle,
}: {
  db: DatabaseOrTransaction;
  locale: Locale;
  category?: BlogCategory | undefined;
  needle?: string | undefined;
}): Promise<BlogPostRecord[]> {
  const english = locale === "en";
  const searchColumn = english ? blogPost.searchTextEn : blogPost.searchText;

  return selectPosts(db)
    .where(
      and(
        eq(blogPost.status, "published"),
        english ? eq(blogPost.hasEnglish, true) : undefined,
        category ? eq(blogPost.category, category) : undefined,
        needle ? like(searchColumn, `%${escapeLike(needle)}%`) : undefined,
      ),
    )
    .orderBy(desc(blogPost.publishedAt));
}

/** One published post by its current address. */
export async function findPublishedPostBySlug({
  db,
  slug,
}: {
  db: DatabaseOrTransaction;
  slug: string;
}): Promise<BlogPostRecord | undefined> {
  const [row] = await selectPosts(db)
    .where(and(eq(blogPost.slug, slug), eq(blogPost.status, "published")))
    .limit(1);
  return row;
}

/** The published post that used to live at `slug`. */
export async function findPublishedPostByPreviousSlug({
  db,
  slug,
}: {
  db: DatabaseOrTransaction;
  slug: string;
}): Promise<BlogPostRow | undefined> {
  const [row] = await db
    .select()
    .from(blogPost)
    .where(and(arrayContains(blogPost.previousSlugs, [slug]), eq(blogPost.status, "published")))
    .limit(1);
  return row;
}

/** Every post, drafts too, most recently changed first. */
export function findAllPosts({ db }: { db: DatabaseOrTransaction }): Promise<BlogPostRecord[]> {
  return selectPosts(db).orderBy(desc(blogPost.updatedAt));
}

export async function findPostById({
  db,
  id,
}: {
  db: DatabaseOrTransaction;
  id: string;
}): Promise<BlogPostRecord | undefined> {
  const [row] = await selectPosts(db).where(eq(blogPost.id, id)).limit(1);
  return row;
}

/** Whether another post holds `slug`, as its address or as an old one that redirects. */
export async function isSlugTaken({
  db,
  slug,
  exceptId,
}: {
  db: DatabaseOrTransaction;
  slug: string;
  exceptId?: string | undefined;
}): Promise<boolean> {
  const [row] = await db
    .select({ id: blogPost.id })
    .from(blogPost)
    .where(
      and(
        or(eq(blogPost.slug, slug), arrayContains(blogPost.previousSlugs, [slug])),
        exceptId ? ne(blogPost.id, exceptId) : undefined,
      ),
    )
    .limit(1);
  return row !== undefined;
}

/** The published posts' addresses and dates, for the sitemap and the feed. */
export function findPublishedPostDates({ db }: { db: DatabaseOrTransaction }) {
  return db
    .select({
      slug: blogPost.slug,
      title: blogPost.title,
      excerpt: blogPost.excerpt,
      hasEnglish: blogPost.hasEnglish,
      publishedAt: blogPost.publishedAt,
      updatedAt: blogPost.updatedAt,
    })
    .from(blogPost)
    .where(eq(blogPost.status, "published"))
    .orderBy(desc(blogPost.publishedAt));
}

/** Media rows by id; unknown ids are left out. */
export function findMediaByIds({ db, ids }: { db: DatabaseOrTransaction; ids: string[] }): Promise<MediaRow[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return db.select().from(media).where(inArray(media.id, ids));
}

export async function findCourseBySlug({
  db,
  slug,
}: {
  db: DatabaseOrTransaction;
  slug: string;
}): Promise<RelatedCourseRow | undefined> {
  const [row] = await db.select().from(course).where(eq(course.slug, slug)).limit(1);
  return row;
}

export async function findCourseById({
  db,
  id,
}: {
  db: DatabaseOrTransaction;
  id: string;
}): Promise<RelatedCourseRow | undefined> {
  const [row] = await db.select().from(course).where(eq(course.id, id)).limit(1);
  return row;
}

/** The slugs of courses by id, for the Admin's list of posts. */
export function findCourseSlugs({ db, ids }: { db: DatabaseOrTransaction; ids: string[] }) {
  if (ids.length === 0) return Promise.resolve([]);
  return db.select({ id: course.id, slug: course.slug }).from(course).where(inArray(course.id, ids));
}

/*===== Writes =====*/
/** Inserts a draft. Undefined when the slug was taken in the meantime (the unique index decides). */
export async function insertPostOnce({
  db,
  values,
}: {
  db: DatabaseOrTransaction;
  values: BlogPostValues;
}): Promise<string | undefined> {
  const [row] = await db
    .insert(blogPost)
    .values({ ...values, status: "draft" })
    .onConflictDoNothing({ target: blogPost.slug })
    .returning({ id: blogPost.id });
  return row?.id;
}

export async function updatePostById({
  db,
  id,
  values,
}: {
  db: DatabaseOrTransaction;
  id: string;
  values: BlogPostValues;
}): Promise<void> {
  await db.update(blogPost).set(values).where(eq(blogPost.id, id));
}

/** Sets the status; `publishedAt` is only written when given (the first publish). */
export async function updatePostStatus({
  db,
  id,
  status,
  publishedAt,
}: {
  db: DatabaseOrTransaction;
  id: string;
  status: BlogStatus;
  publishedAt?: Date;
}): Promise<void> {
  await db
    .update(blogPost)
    .set(publishedAt ? { status, publishedAt } : { status })
    .where(eq(blogPost.id, id));
}

export async function deletePostById({ db, id }: { db: DatabaseOrTransaction; id: string }): Promise<void> {
  await db.delete(blogPost).where(eq(blogPost.id, id));
}
