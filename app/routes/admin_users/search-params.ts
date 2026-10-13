import { createSerializer, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

/*===== Constants =====*/
/** People per page: one card each, so twenty is about two screens of rows on a phone. */
export const PAGE_SIZE = 20;

export const ROLE_FILTERS = ["all", "customer", "partner", "admin"] as const;

export type RoleFilter = (typeof ROLE_FILTERS)[number];

export const STATUS_FILTERS = ["all", "active", "blocked"] as const;

export type StatusFilter = (typeof STATUS_FILTERS)[number];

/** The page's own path, which the row links are built on. */
export const ADMIN_USERS_PATH = "/admin/users";

/*===== Parsers =====*/
// All shallow: the loader fetches the whole list once and the page filters it, so none of these needs a loader run.
// `page` is 1-based in the URL (`?page=2` is the second page), as on the Dogs page. `user` (the open dialog) pushes a
// history entry so Back closes it; it has no default because "absent" means closed.
export const adminUsersSearchParams = {
  role: parseAsStringLiteral(ROLE_FILTERS).withDefault("all").withOptions({ shallow: true }),
  status: parseAsStringLiteral(STATUS_FILTERS).withDefault("all").withOptions({ shallow: true }),
  q: parseAsString.withDefault("").withOptions({ shallow: true }),
  page: parseAsInteger.withDefault(1).withOptions({ shallow: true }),
  user: parseAsString.withOptions({ shallow: true, history: "push" }),
};

/*===== Links =====*/
export const serializeAdminUsersSearchParams = createSerializer(adminUsersSearchParams);
