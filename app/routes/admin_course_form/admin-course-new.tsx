import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import {
  AdminCourseForm,
  CourseFormError,
  courseFormTitle,
  coursesQuery,
} from "~/routes/admin_course_form/admin-course-form";

/*===== Route =====*/
// A new course: the form starts empty. The catalogue is read for the prerequisite choices.
export const Route = createFileRoute("/admin/courses/new")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(coursesQuery()),
  head: () => ({ meta: [{ title: courseFormTitle(undefined) }] }),
  component: NewCoursePage,
  notFoundComponent: () => <CourseFormError notFound />,
  errorComponent: () => <CourseFormError notFound={false} />,
});

/*===== Page =====*/
function NewCoursePage() {
  const { data: courses } = useSuspenseQuery(coursesQuery());
  return <AdminCourseForm course={null} courses={courses} />;
}
