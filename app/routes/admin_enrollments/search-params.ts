import { parseAsInteger, parseAsStringLiteral } from "nuqs/server";

/*===== Constants =====*/
/** Customer blocks per page. A block is a person to call, so ten is a comfortable stretch of phone work. */
export const PAGE_SIZE = 10;

export const ENROLLMENT_FILTERS = ["active", "completed", "cancelled", "all"] as const;

export type EnrollmentFilter = (typeof ENROLLMENT_FILTERS)[number];

/*===== Parsers =====*/
// Shallow: the loader fetches the whole list once and never reads these, so changing a filter or a page is only a URL
// change and the Admin's list doesn't flash while the server answers. `page` is 1-based in the URL.
export const adminEnrollmentsSearchParams = {
  status: parseAsStringLiteral(ENROLLMENT_FILTERS).withDefault("active").withOptions({ shallow: true }),
  page: parseAsInteger.withDefault(1).withOptions({ shallow: true }),
};
