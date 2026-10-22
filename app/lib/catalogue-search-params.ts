import { z } from "zod";

import type { CourseFamily } from "~/orpc/course/constants";

/*===== Catalogue URL =====*/
// The catalogue's whole state is its URL (`?q=&family=&page=`). Shared by the catalogue route, which reads it, and the
// header's course search (`layout_public`), which writes `q` on the catalogue and links to it from every other page.

/*===== Constants =====*/
/** Where the catalogue lives. */
export const CATALOGUE_PATH = "/courses";

/** How long typing pauses before the URL (and so the list) follows it. Enter doesn't wait. */
export const TYPING_DELAY_MS = 350;

/** Cards per page: four rows of three on desktop. */
export const PAGE_SIZE = 12;

/** The longest search the field takes; a longer one in the URL is cut where it's read. */
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

/*===== Schema =====*/
/**
 * The catalogue route's `validateSearch`. Every field is optional and a bad value is dropped rather than failing the
 * page, since anyone can type a URL. Defaults are applied where the values are read: no `q` is an empty search, no
 * `family` is "all", no `page` is the first page (1-based). Links and navigations leave a value out when it equals its
 * default, so the URL stays clean.
 *
 * `q` also takes a number: the router reads `?q=123` (a search typed into the header's form before hydration) as a
 * number, and a digits-only search is still a search.
 */
export const catalogueSearchSchema = z.object({
  q: z
    .union([z.string(), z.number()])
    .transform((value) => String(value))
    .optional()
    .catch(undefined),
  family: z.enum(CATALOGUE_FAMILIES).optional().catch(undefined),
  page: z.number().int().optional().catch(undefined),
});

export type CatalogueSearch = z.output<typeof catalogueSearchSchema>;
