import { z } from "zod";

/*===== Constants =====*/
export const STATUS_FILTERS = ["all", "draft", "published"] as const;

export type StatusFilter = (typeof STATUS_FILTERS)[number];

/*===== Search Schema =====*/
// Not a loader dep: the loader fetches every post once and the page filters them. `status` defaults to «همه» and links
// leave it out; a hand-typed bad value is dropped (`.catch`) instead of failing the page.
export const adminPostsSearchSchema = z.object({
  status: z.enum(STATUS_FILTERS).optional().catch(undefined),
});
