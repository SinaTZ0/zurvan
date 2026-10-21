import { parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

/*===== Constants =====*/
/** Dogs per page. The register is one row per dog, so twenty is about two screens of rows on a phone. */
export const PAGE_SIZE = 20;

export const DOG_STATE_FILTERS = ["all", "none", "evaluated"] as const;

export type DogStateFilter = (typeof DOG_STATE_FILTERS)[number];

/*===== Parsers =====*/
// Shallow: the loader fetches both lists once and never reads these, so typing, filtering and paging only change the
// URL. `page` is 1-based in the URL.
export const adminDogsSearchParams = {
  q: parseAsString.withDefault("").withOptions({ shallow: true }),
  state: parseAsStringLiteral(DOG_STATE_FILTERS).withDefault("all").withOptions({ shallow: true }),
  page: parseAsInteger.withDefault(1).withOptions({ shallow: true }),
};
