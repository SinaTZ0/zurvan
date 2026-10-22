import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { orNotFound } from "~/lib/not-found";
import {
  AdminCourseForm,
  CourseFormError,
  courseFormTitle,
  courseQuery,
  coursesQuery,
} from "~/routes/admin_course_form/admin-course-form";

/*===== Route =====*/
// One course's edit: the API answers NOT_FOUND for an unknown slug, which becomes a 404. The catalogue is read for the
// prerequisite choices.
export const Route = createFileRoute("/admin/courses/$slug/edit")({
  loader: async ({ context: { queryClient }, params }) => {
    const [course] = await orNotFound(
      Promise.all([queryClient.ensureQueryData(courseQuery(params.slug)), queryClient.ensureQueryData(coursesQuery())]),
    );
    return { title: course.title };
  },
  head: ({ loaderData }) => ({ meta: [{ title: courseFormTitle(loaderData?.title) }] }),
  component: EditCoursePage,
  notFoundComponent: () => <CourseFormError notFound />,
  errorComponent: () => <CourseFormError notFound={false} />,
});

/*===== Page =====*/
function EditCoursePage() {
  const { slug } = Route.useParams();
  const { data: course } = useSuspenseQuery(courseQuery(slug));
  const { data: courses } = useSuspenseQuery(coursesQuery());
  return <AdminCourseForm course={course} courses={courses} />;
}
