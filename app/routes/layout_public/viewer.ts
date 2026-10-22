import { type RoleHomePath, roleHomePath } from "~/lib/role-home";
import type { UserRole } from "~/lib/user-constants";
import type { SessionState } from "~/orpc/session/contract";

/*===== Viewer =====*/
/** The signed-in person the storefront header greets. Visitors are `null`, not a viewer. */
export type Viewer = {
  role: UserRole;
  firstName: string;
  phoneNumber: string | null;
  /**
   * Where a partner's or the Admin's own panel is (`roleHomePath` decides); `null` for a role whose home
   * is the storefront. Customers use the fixed account links instead.
   */
  homePath: Exclude<RoleHomePath, "/"> | null;
};

/**
 * The header's viewer from the session answer. A visitor, a blocked account or a new account that hasn't given its name
 * yet all look like a visitor (`null`).
 */
export function toViewer(session: SessionState): Viewer | null {
  if (session.status !== "active") return null;

  const { user } = session;
  const home = roleHomePath(user.role);
  return {
    role: user.role,
    firstName: user.firstName,
    phoneNumber: user.phoneNumber,
    homePath: user.role !== "customer" && home !== "/" ? home : null,
  };
}
