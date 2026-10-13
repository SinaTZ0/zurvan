import { AdminPageHeader } from "~/components/admin-page-header";

import type { Route } from "./+types/admin-courses";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "دوره‌ها | مدیریت آموزش K9" }];

/*===== AdminCourses =====*/
// Stub: the page is built in its own commit.
export default function AdminCourses() {
  return <AdminPageHeader title="دوره‌ها" />;
}
