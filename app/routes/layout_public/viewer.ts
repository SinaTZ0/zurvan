import type { UserRole } from "~/lib/user-constants";

/*===== Viewer =====*/
/** The signed-in person the storefront header greets. Visitors are `null`, not a viewer. */
export type Viewer = {
  role: UserRole;
  firstName: string;
  phoneNumber: string | null;
  /**
   * Where a partner's or the Admin's own panel is (`roleHomePath`, server-only, decides); `null` for a role whose home
   * is the storefront. Customers use the fixed account links instead.
   */
  homePath: string | null;
};
