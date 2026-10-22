import { z } from "zod";

/*===== Constants =====*/
/** Dogs per page. The register is one row per dog, so twenty is about two screens of rows on a phone. */
export const PAGE_SIZE = 20;

export const DOG_STATE_FILTERS = ["all", "none", "evaluated"] as const;

export type DogStateFilter = (typeof DOG_STATE_FILTERS)[number];

/** The filter an absent `?state=` means; links leave it out of the URL. */
export const DEFAULT_DOG_STATE_FILTER = "all" satisfies DogStateFilter;

/*===== Search Schema =====*/
// None of these is a loader dep: the loader fetches both lists once and never reads them, so typing, filtering and
// paging only change the URL. `page` is 1-based in the URL; absent means the first page, an empty `q` no search. A
// hand-typed bad value is dropped (`.catch`) instead of failing the page.
export const adminDogsSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  state: z.enum(DOG_STATE_FILTERS).optional().catch(undefined),
  page: z.number().int().optional().catch(undefined),
});
