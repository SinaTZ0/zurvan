import type { UserRole } from "~/lib/user-constants";

/*===== Viewer =====*/
/** The signed-in person the storefront header greets. Visitors are `null`, not a viewer. */
export type Viewer = {
  role: UserRole;
  firstName: string;
  phoneNumber: string | null;
  /**
   * Where a partner or the Admin's own panel is, once it is built; `null` while their role home is the storefront
   * (`roleHomePath`, server-only, decides). Customers use the fixed account links instead.
   */
  homePath: string | null;
};
