import type { UserRole } from "~/lib/user-constants";

/*===== Role Homes =====*/
// Where a signed-in person belongs when they open a page their role can't use. Partners have their own dashboard in
// the account shell (app-spec, Pages). Browser-safe: guards and the storefront header both need it.
const ROLE_HOME: Record<UserRole, string> = {
  customer: "/account",
  partner: "/account/partner",
  admin: "/admin",
};

/** The landing page for a role. Unknown roles (a value removed from the list) go to the storefront. */
export function roleHomePath(role: string | null | undefined): string {
  return ROLE_HOME[role as UserRole] ?? "/";
}
