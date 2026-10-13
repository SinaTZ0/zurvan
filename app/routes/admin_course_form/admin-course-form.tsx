import { AdminPageHeader } from "~/components/admin-page-header";

import type { Route } from "./+types/admin-course-form";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "فرم دوره | مدیریت آموزش K9" }];

/*===== AdminCourseForm =====*/
// Stub: the page is built in its own commit.
export default function AdminCourseForm() {
  return <AdminPageHeader title="فرم دوره" />;
}
