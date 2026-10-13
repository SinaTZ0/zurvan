import { createLoader, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

import type { CourseFamily } from "~/orpc/course/constants";

/*===== Constants =====*/
/** Cards per page: four rows of three on desktop. */
export const PAGE_SIZE = 12;

/** The longest search the field takes; a longer one in the URL is cut by the loader. */
export const MAX_QUERY_LENGTH = 60;

/**
 * The families a visitor can filter by. `behavior` is left out on purpose (app-spec: it is dropped), so it can't be
 * reached from a link either.
 */
export const CATALOGUE_FAMILIES = [
  "basics",
  "six-month",
  "obedience",
  "companion",
  "working",
  "sport",
] as const satisfies readonly CourseFamily[];

/** Narrows a family from the shared filter to one the URL can hold; "all" and `behavior` are not in the URL. */
export function isCatalogueFamily(value: string): value is (typeof CATALOGUE_FAMILIES)[number] {
  return (CATALOGUE_FAMILIES as readonly string[]).includes(value);
}

/*===== Parsers =====*/
// `family` has no default: absent means "all", and `null` is how a component clears it. `page` is 1-based in the URL.
export const catalogueSearchParams = {
  q: parseAsString.withDefault(""),
  family: parseAsStringLiteral(CATALOGUE_FAMILIES),
  page: parseAsInteger.withDefault(1),
};

/*===== Server Loader =====*/
export const loadCatalogueSearchParams = createLoader(catalogueSearchParams);
