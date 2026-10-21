import { createFileRoute } from "@tanstack/react-router";
import { ORPCError } from "@orpc/client";
import { useRef } from "react";
import { data, isRouteErrorResponse } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { createServerClient } from "~/orpc/server-client.server";
import { BuyCard } from "~/routes/course_detail/components/buy-card";
import { ClosingBand } from "~/routes/course_detail/components/closing-band";
import { CourseHero } from "~/routes/course_detail/components/course-hero";
import { LaneRail } from "~/routes/course_detail/components/lane-rail";
import { LearnSection } from "~/routes/course_detail/components/learn-section";
import { PhoneActionBar } from "~/routes/course_detail/components/phone-action-bar";
import { useBuyCard, type Viewer } from "~/routes/course_detail/components/use-buy-card";
import { COLUMN } from "~/routes/course_detail/column";
import { getLane } from "~/routes/course_detail/lane";

import type { PublicLayoutHandle } from "~/routes/layout_public/layout-public";

import type { Route } from "./+types/course-detail";

/*===== Handle =====*/
// The closing band, a brick wall, runs straight into the footer.
export const handle: PublicLayoutHandle = { flushFooter: true };

/*===== Meta =====*/
export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) return [{ title: "دوره پیدا نشد | آموزش K9" }];
  const { course } = loaderData;
  return [{ title: `${course.title} | آموزش K9` }, { name: "description", content: course.summary }];
};

/*===== Loader =====*/
// Public: a visitor reads the course, so there is no guard. The session is only read to know who is looking.
// Working and sport dogs (`/courses/working-dogs`, `/courses/sport`) are course rows too, so they land here.
export async function loader({ request, params }: Route.LoaderArgs) {
  const client = createServerClient(request);
  const [course, catalogue, session] = await Promise.all([
    client.course.get({ slug: params.slug }).catch((error: unknown) => {
      if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
      throw error;
    }),
    client.course.list(),
    client.session.get(),
  ]);

  /*------ Viewer ------*/
  // A customer who hasn't given a name yet is still finishing sign-up: for this page they are a visitor, and the sign-in
  // page asks for the name before sending them back here. A blocked account reads as signed out.
  const viewer: Viewer =
    session.status === "anonymous"
      ? "visitor"
      : session.user.role !== "customer"
        ? "other"
        : session.status === "active"
          ? "customer"
          : "visitor";

  /*------ Which Dogs Can Buy ------*/
  // Only a customer, and only for a course that has a price (a working or sport course isn't sold online).
  const eligibility =
    viewer === "customer" && course.price !== null
      ? await client.checkout.eligibility({ courseSlug: course.slug })
      : [];

  return { course, lane: getLane({ course, catalogue }), viewer, eligibility };
}

/*===== Page =====*/
export default function CourseDetailPage({ loaderData }: Route.ComponentProps) {
  const { course, lane, viewer, eligibility } = loaderData;
  // The card and the phone bar draw the same state, so it is worked out once here.
  const buy = useBuyCard({ course, viewer, eligibility });
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/*===== Hero and Buy Card =====*/}
      <CourseHero course={course}>
        <BuyCard course={course} buy={buy} cardRef={cardRef} />
      </CourseHero>

      {/*===== What You Learn and What Comes Next =====*/}
      {/* 7/5 when the lane has something to say; a course with no lane content (CGC, working dogs) gets the whole width
          rather than an empty end column. `LaneRail` renders nothing for those, so the grid asks for its heading. */}
      <div
        className={`${COLUMN} grid gap-y-section-sm pt-section-sm lg:has-[#lane-title]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:has-[#lane-title]:gap-x-16 xl:has-[#lane-title]:gap-x-24`}
      >
        <LearnSection course={course} />
        {lane && <LaneRail course={course} lane={lane} />}
      </div>

      {/*===== Closing =====*/}
      {/* Room above the band for the dog sitting on it. */}
      <div className="mt-48 md:mt-56">
        <ClosingBand />
      </div>

      <PhoneActionBar course={course} buy={buy} cardRef={cardRef} />
    </>
  );
}

/*===== Error Boundary =====*/
// Renders inside the public layout, so a mistyped course link still has the header, footer and a way on.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="course-error-title" className={`${COLUMN} py-section-md`}>
      <div className="max-w-xl">
        <h1 id="course-error-title" className={`${DISPLAY_HEADING} text-h1 text-balance`}>
          {notFound ? "این دوره پیدا نشد" : "صفحه‌ی این دوره باز نشد"}
        </h1>
        <p className="mt-4 text-lead text-pretty text-muted-foreground">
          {notFound
            ? "شاید نشانی‌اش عوض شده باشد. همه‌ی دوره‌ها را ببین، یا با ارزیابی رایگان شروع کن تا دوره‌ی مناسب سگت را با هم پیدا کنیم."
            : "مشکلی پیش آمد و اطلاعات دوره نرسید. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/courses" className={buttonVariants({ variant: "solid", size: "lg" })}>
            همه‌ی دوره‌ها را ببین
          </Link>
          <Link to="/assessment" className={buttonVariants({ variant: "outline", size: "lg" })}>
            ارزیابی رایگان رزرو کن
          </Link>
        </div>
      </div>
    </section>
  );
}

// Placeholder until B5 converts this page.
export const Route = createFileRoute("/_public/courses/$slug")({});
