import { z } from "zod";

/*===== Constants =====*/
/** Customer blocks per page. A block is a person to call, so ten is a comfortable stretch of phone work. */
export const PAGE_SIZE = 10;

export const ENROLLMENT_FILTERS = ["active", "completed", "cancelled", "all"] as const;

export type EnrollmentFilter = (typeof ENROLLMENT_FILTERS)[number];

/** The filter an absent `?status=` means; links leave it out of the URL. */
export const DEFAULT_ENROLLMENT_FILTER = "active" satisfies EnrollmentFilter;

/*===== Search Schema =====*/
// Neither is a loader dep: the loader fetches the whole list once and never reads them, so changing a filter or a page
// is only a URL change and the Admin's list doesn't flash while the server answers. `page` is 1-based in the URL;
// absent means the first page. A hand-typed bad value is dropped (`.catch`) instead of failing the page.
export const adminEnrollmentsSearchSchema = z.object({
  status: z.enum(ENROLLMENT_FILTERS).optional().catch(undefined),
  page: z.number().int().optional().catch(undefined),
});
