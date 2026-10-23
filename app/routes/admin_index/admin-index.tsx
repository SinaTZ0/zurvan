import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { cn } from "cn";

import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { ADMIN_PLATE } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import { orpc } from "~/orpc/client";

import { CoursesPlate } from "./components/courses-plate";
import { EnrollmentsPlate } from "./components/enrollments-plate";
import { MoneyPlate } from "./components/money-plate";
import { PageMotion } from "./components/page-motion";
import { SectionHead } from "./components/section-head";
import { WaitingPlate } from "./components/waiting-plate";
import { describeTodayInTehran } from "./today";

/*===== Route =====*/
// The guard is the layout's. One call reads every number on the page, the same query the layout's badges read, so
// any Admin action (which invalidates every API query) refreshes both. Today's date is computed in the loader, on the
// Tehran clock, and handed to the page as loader data, so the server's render and the hydrated page can't disagree
// about the day.
export const Route = createFileRoute("/admin/")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(orpc.dashboard.admin.overview.queryOptions());
    return { today: describeTodayInTehran() };
  },
  head: () => ({ meta: [{ title: "نمای کلی | مدیریت زروان" }] }),
  component: AdminIndexPage,
  notFoundComponent: () => <OverviewError notFound />,
  errorComponent: () => <OverviewError notFound={false} />,
});

/*===== Admin Overview =====*/
/**
 * F11: what waits for the Admin today and how the center is doing, in one glance. Only the work is lit: one plate at
 * the top holds the day's work (the counters in gold above zero, the latest purchases to call), and everything under it
 * is calm ivory, so on a good day the page shows no gold at all. Every number links to its list, already filtered. The
 * page writes nothing; its only motion answers a refetch (a changed number pops, a strip slides).
 */
function AdminIndexPage() {
  const { today } = Route.useLoaderData();
  const { data: overview, isFetching } = useSuspenseQuery(orpc.dashboard.admin.overview.queryOptions());
  const { waiting, enrollments, money, courses } = overview;

  /*------ Pending ------*/
  // An answer elsewhere marks the numbers stale; the page dims while the new ones load.
  const pending = isFetching;

  // «،» rather than «·»: a middle dot beside a Persian digit reads as a zero («۲۹ مهر · ۲» looks like «۲۰»).
  const waitingCount = waiting.evaluationRequests + waiting.paidNotEnrolled.count;
  const work = waitingCount > 0 ? `${formatNumberFa(waitingCount)} کار منتظر توست` : "کاری منتظرت نیست";

  return (
    <div>
      <PageMotion />

      {/*===== Header =====*/}
      <AdminPageHeader title="نمای کلی" summary={`${today}، ${work}`} />

      <div
        aria-busy={pending}
        className={cn("flex flex-col gap-8 transition-opacity lg:gap-10", pending && "opacity-60")}
      >
        {/*===== Waiting =====*/}
        <section aria-labelledby="overview-waiting-title">
          <SectionHead id="overview-waiting-title" title="منتظر توست" />
          <WaitingPlate waiting={waiting} />
        </section>

        {/*===== Enrollments and Money =====*/}
        {/* Side by side from `xl` (7/5); below it the column beside the rail is too narrow for the big amount. */}
        <div className="grid gap-8 xl:grid-cols-12">
          {/*------ Enrollments ------*/}
          <section aria-labelledby="overview-enrollments-title" className="flex flex-col xl:col-span-7">
            <SectionHead id="overview-enrollments-title" title="ثبت‌نام‌ها" />
            <div className="flex-1">
              <EnrollmentsPlate enrollments={enrollments} />
            </div>
          </section>

          {/*------ Money ------*/}
          <section aria-labelledby="overview-money-title" className="flex flex-col xl:col-span-5">
            <SectionHead id="overview-money-title" title="پول" />
            <div className="flex-1">
              <MoneyPlate money={money} />
            </div>
          </section>
        </div>

        {/*===== Courses =====*/}
        <section aria-labelledby="overview-courses-title">
          <SectionHead id="overview-courses-title" title="دوره‌ها" />
          <CoursesPlate courses={courses} />
        </section>
      </div>
    </div>
  );
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the rail and tabs stay.
function OverviewError({ notFound }: { notFound: boolean }) {
  return (
    <div>
      <AdminPageHeader
        title={notFound ? "این صفحه پیدا نشد" : "نمای کلی باز نشد"}
        summary={notFound ? "آدرسش درست نیست یا دیگه وجود نداره." : "عددها نرسیدن."}
      />
      <div className={cn(ADMIN_PLATE, "flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6")}>
        <p className="max-w-xl text-sm text-pretty text-muted-foreground">
          {notFound
            ? "از منو برو سراغ صفحه‌ای که می‌خوای."
            : "یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."}
        </p>
        {notFound ? (
          <Link
            to="/admin"
            className={buttonVariants({ variant: "solid", className: "w-full shrink-0 px-6 sm:w-auto" })}
          >
            برگرد به نمای کلی
          </Link>
        ) : (
          // A full reload, past whatever failed in the app.
          <a
            href="/admin"
            className={buttonVariants({ variant: "solid", className: "w-full shrink-0 px-6 sm:w-auto" })}
          >
            دوباره باز کن
          </a>
        )}
      </div>
    </div>
  );
}
