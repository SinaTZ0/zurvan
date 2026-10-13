import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { describeSessions, formatToman } from "~/lib/course-format";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { Course } from "~/orpc/course/contract";
import { getCourseActions } from "~/routes/course_detail/actions";

/*===== Course Pricing =====*/
/**
 * The closing ask, on a sunken band: what it costs, what comes back if plans change, and the next step once more.
 * The heading repeats the promise that matters before money does: the trainer sees the dog first. This is where the
 * gold-leaf button appears, below the first screen.
 */
export function CoursePricing({
  course,
  actionsRef,
}: {
  course: Course;
  /** Watched by the phone action bar, which steps aside while these buttons are on screen. */
  actionsRef: React.Ref<HTMLDivElement>;
}) {
  const actions = getCourseActions(course);

  return (
    <section
      aria-labelledby="pricing-title"
      className="glow mt-section-md bg-sunken py-section-md [--glow-alpha:0.12] [--glow-at:20%_50%] [--glow-h:80%] [--glow-w:45%]"
    >
      <div className="site-container grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:items-center lg:gap-x-16 xl:gap-x-24">
        {/*------ The Ask ------*/}
        <div>
          <h2 id="pricing-title" className="font-display text-h2 font-bold text-balance">
            قبل از این دوره، {HEAD_TRAINER.firstName} سگت را می‌بیند
          </h2>
          <p className="mt-4 max-w-[34rem] text-lead text-pretty text-muted-foreground">
            ارزیابی اول رایگان است و تعهدی نمی‌آورد. بعد از آن می‌دانی سگت از کجا شروع می‌کند.
          </p>
          <div ref={actionsRef} className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to={actions.main.to}
              className={buttonVariants({ size: "lg", className: "px-8 hover:text-primary-foreground" })}
            >
              {actions.main.label}
            </Link>
            {actions.alternative && (
              <Link
                to={actions.alternative.to}
                className={buttonVariants({ variant: "outline", size: "lg", className: "hover:text-primary" })}
              >
                {actions.alternative.label}
              </Link>
            )}
            {actions.testOnly && (
              <Link
                to={actions.testOnly.to}
                className={buttonVariants({
                  variant: "ghost",
                  size: "lg",
                  className: "text-primary hover:text-primary",
                })}
              >
                {actions.testOnly.label}
              </Link>
            )}
          </div>
        </div>

        {/*------ Price Sheet ------*/}
        <div className="rounded-3xl bg-card p-6 text-card-foreground shadow-sm sm:p-8">
          <dl className="divide-y">
            {course.price === null ? (
              <Row term="هزینه">بعد از ارزیابی رایگان، برای گرایشی که انتخاب می‌کنید.</Row>
            ) : (
              <>
                <Row term="هزینه‌ی دوره">
                  <span className="text-xl font-extrabold text-primary">{formatToman(course.price)}</span>
                  <span className="block text-sm text-muted-foreground">برای {describeSessions(course)}</span>
                </Row>
                <Row term="پانسیون">
                  {course.boardingPrice !== null ? (
                    <>
                      <span className="font-bold">{formatToman(course.boardingPrice)}</span>
                      <span className="block text-sm text-muted-foreground">اختیاری، روی هزینه‌ی دوره</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">اختیاری. برای قیمتش تماس بگیر.</span>
                  )}
                </Row>
              </>
            )}
          </dl>
        </div>
      </div>
    </section>
  );
}

/*===== Row =====*/
function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm font-bold text-saffron-text sm:pt-0.5">{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}
