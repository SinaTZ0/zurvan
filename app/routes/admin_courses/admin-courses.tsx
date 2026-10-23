import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { cn } from "cn";
import { BookOpenIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { useAdminAction } from "~/hooks/use-admin-action";
import { ADMIN_HAIRLINE, ADMIN_PLATE } from "~/lib/admin-plate";
import { client, orpc } from "~/orpc/client";
import type { AdminCourse } from "~/orpc/course/contract";
import { ArchiveDialog } from "~/routes/admin_courses/components/archive-dialog";
import { CourseRow, type MoveDirection } from "~/routes/admin_courses/components/course-row";
import { CoursesMotion } from "~/routes/admin_courses/components/courses-motion";
import { PopNumber } from "~/routes/admin_courses/components/pop-number";
import { useSwapSlide } from "~/routes/admin_courses/hooks/use-swap-slide";
import { INK_OUTLINE, SHELF_COLUMNS, SHELF_PADDING } from "~/routes/admin_courses/surfaces";

/*===== Focus =====*/
/** Puts focus back on the arrow he pressed once the rows have swapped, or on its twin if that one is now at the end. */
function refocus({ slug, direction }: { slug: string; direction: MoveDirection }) {
  return () => {
    const row = document.querySelector(`[data-course="${CSS.escape(slug)}"]`);
    const pressed = row?.querySelector<HTMLButtonElement>(`[data-move="${direction}"]`);
    const twin = row?.querySelector<HTMLButtonElement>(`[data-move="${direction === "up" ? "down" : "up"}"]`);
    if (!pressed) return;
    // Only focus that was on the pressed arrow (or that the move dropped to the page) is followed; elsewhere it stays.
    const active = document.activeElement;
    if (active && active !== document.body && active !== pressed) return;
    // At the shelf's end the pressed arrow is now disabled for good (`disabled`, not just locked), so its twin takes it.
    const target = pressed.disabled ? twin : pressed;
    if (target && target !== active) target.focus({ preventScroll: true });
  };
}

/*===== Route =====*/
// The guard is the layout's. Every course comes once, in catalogue order, archived ones included: there are a dozen,
// so nothing is filtered, paged or kept in the URL.
export const Route = createFileRoute("/admin/courses")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(orpc.course.admin.list.queryOptions()),
  head: () => ({ meta: [{ title: "دوره‌ها | مدیریت زروان" }] }),
  component: AdminCoursesPage,
  notFoundComponent: () => <CoursesError notFound />,
  errorComponent: () => <CoursesError notFound={false} />,
});

/*===== Admin Courses =====*/
/**
 * The shelf: the catalogue in the order customers meet it, one plate of rungs. Courses open one after another, so the
 * position number and the arrows are the information here, and each «بعد از:» line names the rung before it.
 * Archiving takes a course off sale without deleting it (its enrollments and prerequisites keep working); restoring is
 * one click.
 *
 * **A move is seen.** ↑ or ↓ swaps the two rows on screen at once (`order`, an optimistic copy of the new order) and
 * they slide past each other while the write runs; the arrows wait for it. If the write fails, the copy is dropped, so
 * the rows slide back to the server's order and a toast says it didn't happen. After a success the reloaded list has
 * the same order, so dropping the copy moves nothing.
 */
function AdminCoursesPage() {
  const { data: loadedCourses, isFetching } = useSuspenseQuery(orpc.course.admin.list.queryOptions());

  /*------ Order ------*/
  // The slugs in the order he just made, until the server's list agrees (or the write fails).
  const [order, setOrder] = useState<string[] | null>(null);
  const courses = useMemo(() => {
    if (!order) return loadedCourses;
    const bySlug = new Map(loadedCourses.map((course) => [course.slug, course]));
    const ordered = order.map((slug) => bySlug.get(slug)).filter((course) => course !== undefined);
    // A list that changed under him (a course added elsewhere) is the server's to show.
    return ordered.length === loadedCourses.length ? ordered : loadedCourses;
  }, [loadedCourses, order]);

  const { rowRef, capture, liftedKey } = useSwapSlide();

  /*------ Dialog ------*/
  // The target outlives the dialog's closing so its words don't blank mid-fade, and `session` remounts the dialog for
  // each opening so an old failure doesn't come back.
  const [archiveTarget, setArchiveTarget] = useState<{ course: AdminCourse; session: number } | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  /*------ Writes ------*/
  // The hook always toasts a success, so a move says so in one short line. A failure toasts, and the rows slide back.
  const move = useAdminAction({
    mutationFn: async ({ slug, direction }: { slug: string; direction: MoveDirection }) => {
      try {
        return await client.course.admin.move({ slug, direction });
      } catch (error) {
        slideBack({ slug, direction });
        throw error;
      }
    },
    success: "ترتیب عوض شد",
    failureFallback: "جابه‌جا نشد. دوباره امتحان کن.",
    onSuccess: () => setOrder(null),
  });

  const archive = useAdminAction({
    mutationFn: ({ slug }: { slug: string }) => client.course.admin.setStatus({ slug, status: "archived" }),
    success: (course) => `${course.title} بایگانی شد`,
    toastFailure: false,
    onSuccess: () => setArchiveOpen(false),
    onConflict: () => setArchiveOpen(false),
  });

  const [restoringSlug, setRestoringSlug] = useState<string | null>(null);
  const restore = useAdminAction({
    mutationFn: ({ slug }: { slug: string }) => client.course.admin.setStatus({ slug, status: "approved" }),
    success: (course) => `${course.title} دوباره توی فروشه`,
  });

  /*------ Pending ------*/
  // The refetch after a write.
  const busy = isFetching;

  const onSaleCount = courses.filter((course) => course.status === "approved").length;
  const archivedCount = courses.length - onSaleCount;

  /*------ Handlers ------*/
  function moveCourse({ slug, direction }: { slug: string; direction: MoveDirection }) {
    const slugs = courses.map((course) => course.slug);
    const index = slugs.indexOf(slug);
    const other = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || other < 0 || other >= slugs.length) return;

    const next = [...slugs];
    [next[index], next[other]] = [next[other], next[index]];
    capture({ lifted: slug, focus: refocus({ slug, direction }) });
    setOrder(next);
    move.run({ slug, direction });
  }

  /** A failed move: the rows slide back to the server's order (the one he had before pressing). */
  function slideBack({ slug, direction }: { slug: string; direction: MoveDirection }) {
    capture({ lifted: slug, focus: refocus({ slug, direction }) });
    setOrder(null);
  }

  return (
    <div>
      <CoursesMotion />

      {/*===== Header =====*/}
      <AdminPageHeader
        title="دوره‌ها"
        // An empty shelf says so in its own plate, so the line under the title isn't a zero.
        summary={
          courses.length > 0 ? (
            <>
              <PopNumber value={onSaleCount} /> دوره در فروش
              {archivedCount > 0 && (
                <>
                  ، <PopNumber value={archivedCount} /> بایگانی‌شده
                </>
              )}
            </>
          ) : undefined
        }
      >
        <Link to="/admin/courses/new" className={buttonVariants({ variant: "outline", className: INK_OUTLINE })}>
          <PlusIcon aria-hidden />
          دوره‌ی تازه
        </Link>
      </AdminPageHeader>

      {courses.length === 0 ? (
        /*===== Nothing at All =====*/
        <AdminEmptyState title="هنوز دوره‌ای نیست" icon={BookOpenIcon}>
          اولین دوره رو بساز تا توی فهرست و صفحه‌ی اصلی بیاد.
        </AdminEmptyState>
      ) : (
        <>
          {/*===== The Shelf =====*/}
          {/* The dim waits a moment, so the short reload after each move doesn't flash the whole shelf. */}
          <section
            aria-labelledby="admin-courses-shelf"
            aria-busy={busy}
            className={cn("transition-opacity", busy ? "opacity-60 delay-150" : "delay-0")}
          >
            <h2 id="admin-courses-shelf" className="sr-only">
              ترتیب دوره‌ها
            </h2>

            <div className={ADMIN_PLATE}>
              {/*------ Column Head ------*/}
              {/* Only where the row is one line in fixed tracks; the rows say the same to a screen reader. */}
              <div
                aria-hidden
                className={cn(
                  SHELF_COLUMNS,
                  SHELF_PADDING,
                  ADMIN_HAIRLINE,
                  "hidden border-b py-2.5 text-xs text-muted-foreground xl:grid",
                )}
              >
                <span className="w-9 text-center [grid-area:pos]">ردیف</span>
                <span className="[grid-area:cover]">دوره</span>
                <span className="[grid-area:price]">قیمت</span>
                <span className="[grid-area:enr]">ثبت‌نام</span>
              </div>

              {/*------ Rungs ------*/}
              <ol className={cn("divide-y", ADMIN_HAIRLINE)}>
                {courses.map((course, index) => (
                  <CourseRow
                    key={course.slug}
                    course={course}
                    position={index + 1}
                    isFirst={index === 0}
                    isLast={index === courses.length - 1}
                    moveLocked={move.isPending}
                    statusLocked={archive.isPending || restore.isPending}
                    restoring={restore.isPending && restoringSlug === course.slug}
                    lifted={liftedKey === course.slug}
                    rowRef={rowRef(course.slug)}
                    onMove={(direction) => moveCourse({ slug: course.slug, direction })}
                    onArchive={() => {
                      setArchiveTarget((previous) => ({ course, session: (previous?.session ?? 0) + 1 }));
                      setArchiveOpen(true);
                    }}
                    onRestore={() => {
                      setRestoringSlug(course.slug);
                      restore.run({ slug: course.slug });
                    }}
                  />
                ))}
              </ol>
            </div>
          </section>

          {/*===== Footnote =====*/}
          <p className="mt-4 ps-4 text-sm text-pretty text-muted-foreground xl:ps-5">
            ترتیب همینه که مشتری‌ها توی فهرست می‌بینن.
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
function CoursesError({ notFound }: { notFound: boolean }) {
  return (
    <div>
      <AdminPageHeader
        title={notFound ? "این صفحه پیدا نشد" : "دوره‌ها باز نشدن"}
        summary="یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."
      />
      <Link to="/admin" className={buttonVariants({ variant: "outline", className: INK_OUTLINE })}>
        برگرد به نمای کلی
      </Link>
    </div>
  );
}
