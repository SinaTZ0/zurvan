import { AdminPageHeader } from "~/components/admin-page-header";

import type { Route } from "./+types/admin-sms";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "پیامک‌ها | مدیریت آموزش K9" }];

/*===== AdminSms =====*/
// Stub: the page is built in its own commit.
export default function AdminSms() {
  return <AdminPageHeader title="پیامک‌ها" />;
}
