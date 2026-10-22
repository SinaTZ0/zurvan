import type { UserRole } from "~/lib/user-constants";

/*===== Role Homes =====*/
// Where a signed-in person belongs when they open a page their role can't use. Partners have their own dashboard in
// the account shell (app-spec, Pages). Browser-safe: guards and the storefront header both need it.
// Route paths, so `redirect({ to })` and links type-check them.
const ROLE_HOME = {
  customer: "/account",
  partner: "/account/partner",
  admin: "/admin",
} as const satisfies Record<UserRole, string>;

export type RoleHomePath = (typeof ROLE_HOME)[UserRole] | "/";

/** The landing page for a role. Unknown roles (a value removed from the list) go to the storefront. */
export function roleHomePath(role: string | null | undefined): RoleHomePath {
  return ROLE_HOME[role as UserRole] ?? "/";
}
