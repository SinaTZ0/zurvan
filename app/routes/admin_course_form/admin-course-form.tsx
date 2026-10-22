import { ArrowUpLeftIcon } from "lucide-react";

import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { orpc } from "~/orpc/client";
import type { AdminCourse } from "~/orpc/course/contract";
import { CourseForm } from "~/routes/admin_course_form/components/course-form";
import { INK_OUTLINE } from "~/routes/admin_course_form/surfaces";

// The page shared by two routes, each a thin file beside this one: `/admin/courses/new` (`admin-course-new.tsx`) and
// `/admin/courses/$slug/edit` (`admin-course-edit.tsx`). The edit route passes the course; the new one passes `null`.
// The admin layout guards both.

/*===== Queries =====*/
/** The whole catalogue, for the prerequisite choices. Both routes read it. */
export const coursesQuery = () => orpc.course.admin.list.queryOptions();

/** The course being edited. The API answers NOT_FOUND for an unknown slug, which the edit route turns into a 404. */
export const courseQuery = (slug: string) => orpc.course.admin.get.queryOptions({ input: { slug } });

/*===== Head =====*/
/** The tab's title: the course being edited, or «دوره‌ی تازه» (also while there is no course to name). */
export function courseFormTitle(courseTitle: string | undefined) {
  return `${courseTitle ? `ویرایش ${courseTitle}` : "دوره‌ی تازه"} | مدیریت آموزش K9`;
}

/*===== Admin Course Form =====*/
/**
 * F8's form for writing a course the way the public pages show it, and for fixing one when its price, age range or
 * wording changes. The real catalogue card beside the form shows what customers will see.
 */
export function AdminCourseForm({ course, courses }: { course: AdminCourse | null; courses: AdminCourse[] }) {
  return (
    <div>
      {/*===== Header =====*/}
      <AdminPageHeader title={course ? `ویرایش ${course.title}` : "دوره‌ی تازه"} summary={summaryFor(course)}>
        <div className="flex flex-wrap items-center gap-2">
          {course?.status === "approved" && (
            // A new tab: the form keeps what he has typed while he looks at the live page.
            <Link
              to="/courses/$slug"
              params={{ slug: course.slug }}
              target="_blank"
              rel="noopener"
              className={buttonVariants({ variant: "outline", className: INK_OUTLINE })}
            >
              دیدن صفحه‌ی دوره
              <ArrowUpLeftIcon aria-hidden data-icon="inline-end" />
              <span className="sr-only">(توی برگه‌ی تازه)</span>
            </Link>
          )}
          <Link
            to="/admin/courses"
            className={buttonVariants({ variant: "ghost", className: "text-muted-foreground" })}
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
export function CourseFormError({ notFound }: { notFound: boolean }) {
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
      <Link to="/admin/courses" className={buttonVariants({ variant: "outline", className: INK_OUTLINE })}>
        برگرد به دوره‌ها
      </Link>
    </div>
  );
}
