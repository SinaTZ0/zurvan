import { ORPCError } from "@orpc/client";
import { useRef } from "react";
import { data, isRouteErrorResponse } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { createServerClient } from "~/orpc/server-client.server";
import { CourseCardBand } from "~/routes/course_detail/components/course-card-band";
import { CourseDiscussion } from "~/routes/course_detail/components/course-discussion";
import { CourseHero } from "~/routes/course_detail/components/course-hero";
import { CoursePath } from "~/routes/course_detail/components/course-path";
import { CoursePricing } from "~/routes/course_detail/components/course-pricing";
import { PhoneActionBar } from "~/routes/course_detail/components/phone-action-bar";
import { getDiscussion, summarizeRatings } from "~/routes/course_detail/discussion";
import { getLane } from "~/routes/course_detail/lane";

import type { Route } from "./+types/course-detail";

/*===== Meta =====*/
export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) return [{ title: "دوره پیدا نشد | آموزش K9" }];
  const { course } = loaderData;
  return [{ title: `${course.title} | آموزش K9` }, { name: "description", content: course.summary }];
};

/*===== Loader =====*/
// Working and sport dogs (`/courses/working-dogs`, `/courses/sport`) are course rows too, so they land here.
export async function loader({ request, params }: Route.LoaderArgs) {
  const client = createServerClient(request);
  const [course, catalogue] = await Promise.all([
    client.course.get({ slug: params.slug }).catch((error: unknown) => {
      if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
      throw error;
    }),
    client.course.list(),
  ]);

  const discussion = getDiscussion(course.slug);
  return {
    course,
    lane: getLane({ course, catalogue }),
    discussion,
    ratings: summarizeRatings(discussion),
  };
}

/*===== Page =====*/
export default function CourseDetailPage({ loaderData }: Route.ComponentProps) {
  const { course, lane, discussion, ratings } = loaderData;
  // The phone action bar shows once the hero's own buttons have scrolled away, and steps aside for the closing ones.
  const heroActionsRef = useRef<HTMLDivElement>(null);
  const closingActionsRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <CourseHero course={course} ratings={ratings} actionsRef={heroActionsRef} />
      <CourseCardBand course={course} />
      {lane && <CoursePath course={course} lane={lane} />}
      <CourseDiscussion entries={discussion} ratings={ratings} />
      <CoursePricing course={course} actionsRef={closingActionsRef} />
      <PhoneActionBar course={course} heroActionsRef={heroActionsRef} closingActionsRef={closingActionsRef} />
    </>
  );
}

/*===== Error Boundary =====*/
// Renders inside the public layout, so a mistyped course link still has the header, footer and a way on.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="course-error-title" className="site-container py-section-md">
      <div className="max-w-xl">
        <h1 id="course-error-title" className="font-display text-h1 font-bold text-balance">
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
