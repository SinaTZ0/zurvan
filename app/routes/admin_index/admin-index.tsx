import { cn } from "cn";
import { useId } from "react";
import { isRouteErrorResponse, useRevalidator } from "react-router";

import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { createServerClient } from "~/orpc/server-client.server";

import { CountTile } from "./components/count-tile";
import { CoursesTable } from "./components/courses-table";
import { LatestPurchases } from "./components/latest-purchases";
import { MoneyBlock } from "./components/money-block";
import { PaidNotEnrolledTile } from "./components/paid-not-enrolled-tile";
import type { Route } from "./+types/admin-index";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "نمای کلی | مدیریت آموزش K9" }];

/*===== Loader =====*/
// The guard is the layout's. One call reads every number on the page; nothing here is cached, so a revalidation (the
// layout runs one after any answer on another page) always shows the truth.
export async function loader({ request }: Route.LoaderArgs) {
  const overview = await createServerClient(request).dashboard.admin.overview();

  return { overview };
}

/*===== Block =====*/
/** A titled section of the dashboard: an `h2` the section is labelled by. */
function Block({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={className}>
      <h2 id={titleId} className="mb-3 text-base font-extrabold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/*===== Admin Dashboard =====*/
/**
 * F11: what is waiting for the Admin and how the center is doing, in one glance. The page is black and quiet; only what
 * waits for him is lit (gold number and ring), so on a good day it shows no gold and on a busy one the gold is exactly
 * the work. Every number links to the list already filtered to it. The page writes nothing.
 */
export default function AdminIndexPage({ loaderData }: Route.ComponentProps) {
  const { waiting, enrollments, money, courses } = loaderData.overview;

  /*------ Pending ------*/
  // The layout revalidates after an answer elsewhere; the page dims while the new numbers load.
  const revalidator = useRevalidator();
  const pending = revalidator.state !== "idle";

  const waitingCount = waiting.evaluationRequests + waiting.paidNotEnrolled.count;

  return (
    <div>
      {/*===== Header =====*/}
      <AdminPageHeader
        title="نمای کلی"
        summary={waitingCount > 0 ? `${formatNumberFa(waitingCount)} مورد منتظر توست` : "کاری منتظر نیست"}
      />

      <div aria-busy={pending} className={cn("flex flex-col gap-8 transition-opacity", pending && "opacity-60")}>
        {/*===== Waiting =====*/}
        <Block title="منتظر توست">
          {/* The tiles stack at the start, the purchases take the rest. Below `xl` the content beside the rail is too narrow for two columns. */}
          <div className="grid gap-3 xl:grid-cols-12 xl:items-start">
            <div className="flex flex-col gap-3 xl:col-span-4">
              <CountTile
                to="/admin/evaluations"
                count={waiting.evaluationRequests}
                label={waiting.evaluationRequests > 0 ? "درخواست ارزیابی منتظر جواب است" : "درخواستی منتظر نیست"}
                tone={waiting.evaluationRequests > 0 ? "lit" : "calm"}
              />
              <PaidNotEnrolledTile count={waiting.paidNotEnrolled.count} amount={waiting.paidNotEnrolled.amount} />
            </div>
            <div className="xl:col-span-8">
              <LatestPurchases purchases={waiting.latestPurchases} />
            </div>
          </div>
        </Block>

        {/*===== Enrollments and Money =====*/}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          {/*------ Enrollments ------*/}
          <Block title="ثبت‌نام‌ها">
            <div className="grid grid-cols-3 gap-3">
              <CountTile
                to="/admin/enrollments?status=active"
                count={enrollments.active}
                label="در حال آموزش"
                tone="plain"
                layout="stacked"
              />
              <CountTile
                to="/admin/enrollments?status=completed"
                count={enrollments.completed}
                label="تمام شده"
                tone="plain"
                layout="stacked"
              />
              <CountTile
                to="/admin/enrollments?status=cancelled"
                count={enrollments.cancelled}
                label="لغو شده"
                tone="plain"
                layout="stacked"
              />
            </div>
          </Block>

          {/*------ Money ------*/}
          <Block title="پول">
            <MoneyBlock money={money} />
          </Block>
        </div>

        {/*===== Courses =====*/}
        <Block title="دوره‌ها">
          <CoursesTable courses={courses} />
        </Block>
      </div>
    </div>
  );
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the rail and tabs stay.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="admin-index-error-title" className="py-8">
      <h1 id="admin-index-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "نمای کلی باز نشد"}
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
