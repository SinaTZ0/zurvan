import { AdminPageHeader } from "~/components/admin-page-header";

import type { Route } from "./+types/admin-users";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "کاربران | مدیریت آموزش K9" }];

/*===== AdminUsers =====*/
// Stub: the page is built in its own commit.
export default function AdminUsers() {
  return <AdminPageHeader title="کاربران" />;
}
