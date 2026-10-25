/*===== Blog Constants =====*/
// Browser-safe values shared by the API, the Admin's pages and the blog's pages. Stored as plain text
// (see `app/db/schema.ts`), so a new value is a code change, not a migration.

/** Only `published` posts are public; a draft is the Admin's alone (F16). */
export const BLOG_STATUSES = ["draft", "published"] as const;

export type BlogStatus = (typeof BLOG_STATUSES)[number];

/**
 * The blog's sections. A first proposal (2026-10-25): the owner hasn't given her list yet, and changing it is a code
 * change. Labels live with the pages that show them (`messages/blog/`, and the Admin's Persian).
 */
export const BLOG_CATEGORIES = ["behavior", "training", "care", "puppy"] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export function isBlogCategory(value: string): value is BlogCategory {
  return (BLOG_CATEGORIES as readonly string[]).includes(value);
}

export function isBlogStatus(value: string): value is BlogStatus {
  return (BLOG_STATUSES as readonly string[]).includes(value);
}

/** The longest search the blog page sends; longer text can't be a phrase from an article title or line. */
export const BLOG_QUERY_MAX_LENGTH = 80;
