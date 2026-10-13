import { AdminPageHeader } from "~/components/admin-page-header";

import type { Route } from "./+types/admin-settings";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "تنظیمات | مدیریت آموزش K9" }];

/*===== AdminSettings =====*/
// Stub: the page is built in its own commit.
export default function AdminSettings() {
  return <AdminPageHeader title="تنظیمات" />;
}
