import { cn } from "cn";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { isRouteErrorResponse, useRevalidator } from "react-router";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { useAdminAction } from "~/hooks/use-admin-action";
import { formatNumberFa } from "~/lib/digits";
import { client } from "~/orpc/client";
import type { AdminCourse } from "~/orpc/course/contract";
import { createServerClient } from "~/orpc/server-client.server";
import { ArchiveDialog } from "~/routes/admin_courses/components/archive-dialog";
import { CourseRow } from "~/routes/admin_courses/components/course-row";

import type { Route } from "./+types/admin-courses";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "دوره‌ها | مدیریت آموزش K9" }];

/*===== Loader =====*/
// The guard is the layout's. Every course comes once, in catalogue order, archived ones included: there are a dozen,
// so nothing is filtered, paged or kept in the URL.
export async function loader({ request }: Route.LoaderArgs) {
  return { courses: await createServerClient(request).course.admin.list() };
}

/*===== Admin Courses =====*/
/**
 * The shelf: the catalogue in the order customers meet it. Courses open one after another, so the position number and
 * the arrows are the information here, and each «بعد از:» line shows which rung opens which. Archiving takes a course
 * off sale without deleting it (its enrollments and prerequisites keep working); restoring is one click.
 */
export default function AdminCoursesPage({ loaderData }: Route.ComponentProps) {
  const { courses } = loaderData;

  /*------ Dialog ------*/
  // The target outlives the dialog's closing so its words don't blank mid-fade, and `session` remounts the dialog for
  // each opening so an old failure doesn't come back.
  const [archiveTarget, setArchiveTarget] = useState<{ course: AdminCourse; session: number } | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  /*------ Writes ------*/
  // The hook always toasts a success, so a move says so in one short line (the brief asked for none). A failure toasts.
  const move = useAdminAction({
    mutationFn: ({ slug, direction }: { slug: string; direction: "up" | "down" }) =>
      client.course.admin.move({ slug, direction }),
    success: "ترتیب عوض شد",
  });

  const archive = useAdminAction({
    mutationFn: ({ slug }: { slug: string }) => client.course.admin.setStatus({ slug, status: "archived" }),
    success: (course) => `${course.title} بایگانی شد`,
    toastFailure: false,
    onSuccess: () => setArchiveOpen(false),
    onConflict: () => setArchiveOpen(false),
  });

  const restore = useAdminAction({
    mutationFn: ({ slug }: { slug: string }) => client.course.admin.setStatus({ slug, status: "approved" }),
    success: (course) => `${course.title} دوباره در فروش است`,
  });

  /*------ Pending ------*/
  const revalidator = useRevalidator();
  const busy = revalidator.state !== "idle";

  const onSaleCount = courses.filter((course) => course.status === "approved").length;
  const archivedCount = courses.length - onSaleCount;

  return (
    <div>
      {/*===== Header =====*/}
      <AdminPageHeader
        title="دوره‌ها"
        summary={
          archivedCount > 0
            ? `${formatNumberFa(onSaleCount)} دوره در فروش، ${formatNumberFa(archivedCount)} بایگانی‌شده`
            : `${formatNumberFa(onSaleCount)} دوره در فروش`
        }
      >
        <Link to="/admin/courses/new" className={buttonVariants()}>
          <PlusIcon aria-hidden />
          دوره‌ی تازه
        </Link>
      </AdminPageHeader>

      {courses.length === 0 ? (
        /*===== Nothing at All =====*/
        <AdminEmptyState bubble="قفسه‌ام خالیه!" title="هنوز دوره‌ای نیست">
          اولین دوره را بساز تا در فهرست و صفحه‌ی اصلی بیاید.
        </AdminEmptyState>
      ) : (
        <>
          {/*===== The Shelf =====*/}
          <ol aria-busy={busy} className={cn("flex flex-col gap-3 transition-opacity", busy && "opacity-60")}>
            {courses.map((course, index) => (
              <CourseRow
                key={course.slug}
                course={course}
                position={index + 1}
                isFirst={index === 0}
                isLast={index === courses.length - 1}
                isMoving={move.isPending}
                isUpdating={archive.isPending || restore.isPending}
                onMove={(direction) => move.run({ slug: course.slug, direction })}
                onArchive={() => {
                  setArchiveTarget((previous) => ({ course, session: (previous?.session ?? 0) + 1 }));
                  setArchiveOpen(true);
                }}
                onRestore={() => restore.run({ slug: course.slug })}
              />
            ))}
          </ol>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            ترتیب همین است که مشتری‌ها در فهرست می‌بینند.
          </p>
        </>
      )}

      {/*===== Confirm Archive =====*/}
      {archiveTarget && (
        <ArchiveDialog
          key={archiveTarget.session}
          open={archiveOpen}
          onOpenChange={setArchiveOpen}
          course={archiveTarget.course}
          isPending={archive.isPending}
          failure={archive.failure?.message ?? undefined}
          onConfirm={() => archive.run({ slug: archiveTarget.course.slug })}
        />
      )}
    </div>
  );
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the rail and tabs stay.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="admin-courses-error-title">
      <h1 id="admin-courses-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "دوره‌ها باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
      <Link to="/admin" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        برگرد به مدیریت
      </Link>
    </section>
  );
}
