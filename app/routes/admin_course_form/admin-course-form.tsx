import { ORPCError } from "@orpc/client";
import { ArrowUpLeftIcon } from "lucide-react";
import { data, isRouteErrorResponse } from "react-router";

import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { createServerClient } from "~/orpc/server-client.server";
import { CourseForm } from "~/routes/admin_course_form/components/course-form";
import { INK_OUTLINE } from "~/routes/admin_course_form/surfaces";

import type { Route } from "./+types/admin-course-form";

// One module for two routes (see `routes.ts`): `/admin/courses/new` and `/admin/courses/:slug/edit`. A `slug` param
// means edit.

const COURSES_PATH = "/admin/courses";

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
      <AdminPageHeader title={course ? `ویرایش ${course.title}` : "دوره‌ی تازه"} summary={summaryFor(course)}>
        <div className="flex flex-wrap items-center gap-2">
          {course?.status === "approved" && (
            // A new tab: the form keeps what he has typed while he looks at the live page.
            <Link
              to={`/courses/${course.slug}`}
              target="_blank"
              rel="noopener"
              className={buttonVariants({ variant: "outline", className: INK_OUTLINE })}
            >
              دیدن صفحه‌ی دوره
              <ArrowUpLeftIcon aria-hidden data-icon="inline-end" />
              <span className="sr-only">(توی برگه‌ی تازه)</span>
            </Link>
          )}
          <Link to={COURSES_PATH} className={buttonVariants({ variant: "ghost", className: "text-muted-foreground" })}>
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

/*===== Summary =====*/
/**
 * The line under the title: where the course stands. A new course goes on sale as soon as it is made (F8); an archived
 * one can't be bought until it is restored on Courses. A draft (only the seed has them) says nothing: the Admin has no
 * use for the word.
 */
function summaryFor(course: { status: string } | null): string | undefined {
  if (!course) return "تا بسازیش، توی فهرست می‌ره و خریدنی می‌شه.";
  if (course.status === "approved") return "در فروش";
  if (course.status === "archived") return "بایگانی‌شده؛ کسی نمی‌تونه بخردش. برگردوندنش توی صفحه‌ی دوره‌هاست.";
  return undefined;
}

/*===== Error Boundary =====*/
// Inside the Admin shell, so the rail and tabs stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div>
      <AdminPageHeader
        title={notFound ? "این دوره پیدا نشد" : "فرم دوره باز نشد"}
        summary={
          notFound
            ? "شاید نشانیش اشتباهه. از فهرست دوره‌ها دوباره بازش کن."
            : "یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."
        }
      />
      <Link to={COURSES_PATH} className={buttonVariants({ variant: "outline", className: INK_OUTLINE })}>
        برگرد به دوره‌ها
      </Link>
    </div>
  );
}
