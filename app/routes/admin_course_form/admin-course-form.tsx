import { ORPCError } from "@orpc/client";
import { data, isRouteErrorResponse } from "react-router";

import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { createServerClient } from "~/orpc/server-client.server";
import { CourseForm } from "~/routes/admin_course_form/components/course-form";

import type { Route } from "./+types/admin-course-form";

// One module for two routes (see `routes.ts`): `/admin/courses/new` and `/admin/courses/:slug/edit`. A `slug` param
// means edit.

const COURSES_PATH = "/admin/courses";
// A draft course (only the seed has them) says nothing: the Admin has no use for the word.
const STATUS_SUMMARY: Record<string, string | undefined> = { approved: "در فروش", archived: "بایگانی‌شده" };

/*===== Meta =====*/
export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: `${loaderData?.course ? `ویرایش ${loaderData.course.title}` : "دوره‌ی تازه"} | مدیریت آموزش K9` },
];

/*===== Loader =====*/
// The admin layout guards the route. The whole catalogue is loaded for the prerequisite choices; the API answers
// NOT_FOUND for an unknown slug, which becomes a 404.
export async function loader({ request, params }: Route.LoaderArgs) {
  const client = createServerClient(request);
  const slug = params.slug;

  const [course, courses] = await Promise.all([
    slug ? client.course.admin.get({ slug }) : null,
    client.course.admin.list(),
  ]).catch((error: unknown) => {
    if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
    throw error;
  });

  return { course, courses };
}

/*===== Admin Course Form =====*/
/**
 * F8's form for writing a course the way the public pages show it, and for fixing one when its price, age range or
 * wording changes. The real catalogue card beside the form shows what customers will see.
 */
export default function AdminCourseForm({ loaderData }: Route.ComponentProps) {
  const { course, courses } = loaderData;

  return (
    <div>
      {/*===== Header =====*/}
      <AdminPageHeader
        title={course ? `ویرایش ${course.title}` : "دوره‌ی تازه"}
        summary={course ? STATUS_SUMMARY[course.status] : undefined}
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {course?.status === "approved" && (
            <Link to={`/courses/${course.slug}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              دیدن صفحه‌ی دوره
            </Link>
          )}
          <Link
            to={COURSES_PATH}
            className="text-sm font-bold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            بازگشت به دوره‌ها
          </Link>
        </div>
      </AdminPageHeader>

      {/*===== Form =====*/}
      {/* Keyed by course so the form starts fresh when the Admin goes from one course's edit to another's. */}
      <CourseForm key={course?.slug ?? "new"} course={course} courses={courses} />
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the Admin shell, so the rail and tabs stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="admin-course-form-error-title" className="py-10">
      <h1 id="admin-course-form-error-title" className="text-2xl font-extrabold">
        {notFound ? "این دوره پیدا نشد" : "فرم دوره باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        {notFound
          ? "از فهرست دوره‌ها دوباره بازش کن."
          : "مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن."}
      </p>
      <Link to={COURSES_PATH} className={buttonVariants({ size: "lg", className: "mt-6" })}>
        دوره‌ها
      </Link>
    </section>
  );
}
