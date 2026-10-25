import { z } from "zod";

import { BLOG_CATEGORIES, BLOG_QUERY_MAX_LENGTH } from "~/orpc/blog/constants";

/*===== Search Schema =====*/
// The blog's state is its URL (docs/search-params.md): a section and a search, so a filtered list can be shared and
// renders the same on the server. Both pick what the server sends, so they are the loader's deps. A digits-only search
// sent by a plain form arrives as a number; it is turned back into text.
export const blogSearchSchema = z.object({
  category: z.enum(BLOG_CATEGORIES).optional().catch(undefined),
  q: z
    .union([z.string(), z.number()])
    .transform((value) => String(value))
    .optional()
    .catch(undefined),
});

export type BlogSearch = z.infer<typeof blogSearchSchema>;

/** The search as the API takes it: trimmed, cut to its limit, absent when blank. */
export function cleanQuery(q: string | undefined): string | undefined {
  const text = (q ?? "").trim().slice(0, BLOG_QUERY_MAX_LENGTH);
  return text === "" ? undefined : text;
}
