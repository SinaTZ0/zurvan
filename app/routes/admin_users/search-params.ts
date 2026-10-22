import { z } from "zod";

/*===== Constants =====*/
/** People per page: twenty dense rows, about a screen and a half at 1440 and two screens on a phone. */
export const PAGE_SIZE = 20;

export const ROLE_FILTERS = ["all", "customer", "partner", "admin"] as const;

export type RoleFilter = (typeof ROLE_FILTERS)[number];

export const STATUS_FILTERS = ["all", "active", "blocked"] as const;

export type StatusFilter = (typeof STATUS_FILTERS)[number];

/*===== Search Schema =====*/
// None is a loader dep: the loader fetches the whole list once and the page filters it. `role` and `status` default to
// «all» and `page` to the first (1-based, as on the Dogs page); links leave the defaults out. `user` (the open dialog)
// is pushed as a history entry so Back closes it; absent means closed. A hand-typed bad value is dropped (`.catch`)
// instead of failing the page.
export const adminUsersSearchSchema = z.object({
  role: z.enum(ROLE_FILTERS).optional().catch(undefined),
  status: z.enum(STATUS_FILTERS).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  page: z.number().int().optional().catch(undefined),
  user: z.string().optional().catch(undefined),
});

export type AdminUsersSearch = z.infer<typeof adminUsersSearchSchema>;
