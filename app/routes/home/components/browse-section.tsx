import { cn } from "cn";
import { CakeIcon, CheckIcon, ClockIcon, KeyRoundIcon, MapPinIcon, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { Link } from "~/components/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { buttonVariants } from "~/components/ui/button";
import { describeAge, describePlace, describeSessions } from "~/routes/home/courses";
import { type Problem, PROBLEMS } from "~/routes/home/problems";

/*===== Browse Section =====*/
/**
 * Browsing by problem, in the owner's words, instead of by catalogue category: "قلاده را می‌کشد" leads to the leash
 * course. On desktop a photo of the course beside the list follows the row under the pointer or focus, so moving
 * through the list previews each course without leaving it. A row opens in place with the course details and the
 * next step, so reading about a course doesn't cost a page change.
 */
export function BrowseSection() {
  const [activeId, setActiveId] = useState(PROBLEMS[0]!.id);
  const [openId, setOpenId] = useState<string | null>(null);
  const active = PROBLEMS.find((problem) => problem.id === activeId) ?? PROBLEMS[0]!;

  return (
    <section aria-labelledby="browse-title" className="site-container pt-section-md">
      {/*------ Heading ------*/}
      <div className="max-w-2xl">
        <h2 id="browse-title" className="text-h2 text-balance">
          سگت چه کاری می‌کند؟
        </h2>
        <p className="mt-2 text-pretty text-muted-foreground">
          کاری را که می‌خواهی تغییر کند پیدا کن تا دوره‌ای را که برایش ساخته شده ببینی. مطمئن نیستی کدام؟ در ارزیابی
          رایگان با هم انتخابش می‌کنیم.
        </p>
      </div>

      <div className="mt-8 grid gap-gutter lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16">
        {/*------ Index ------*/}
        <Accordion
          value={openId ? [openId] : []}
          onValueChange={(value) => {
            const next = value[0] ?? null;
            setOpenId(next);
            // Opening a row also moves the preview to it, which matters on touch screens that never hover.
            if (next) setActiveId(next);
          }}
          className="border-t"
        >
          {PROBLEMS.map((problem) => (
            <ProblemRow
              key={problem.id}
              problem={problem}
              isActive={problem.id === active.id}
              onActivate={() => setActiveId(problem.id)}
            />
          ))}
        </Accordion>

        {/*------ Preview ------*/}
        <CoursePreview problems={PROBLEMS} active={active} />
      </div>
    </section>
  );
}

/*===== Problem Row =====*/
function ProblemRow({
  problem,
  isActive,
  onActivate,
}: {
  problem: Problem;
  isActive: boolean;
  onActivate: () => void;
}) {
  const { course } = problem;

  return (
    <AccordionItem value={problem.id} className="border-b transition-colors data-open:bg-primary/5">
      <AccordionTrigger
        onPointerEnter={onActivate}
        onFocus={onActivate}
        className="group/row items-center gap-4 rounded-none px-4 py-5 text-base font-normal transition-colors hover:bg-primary/5 hover:no-underline aria-expanded:hover:bg-transparent **:data-[slot=accordion-trigger-icon]:size-6 **:data-[slot=accordion-trigger-icon]:text-faint sm:gap-6 sm:px-6 lg:py-6"
      >
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-h3 leading-snug transition-colors",
              // Desktop marks the row the preview shows; phones have no preview, so nothing to mark.
              isActive && "lg:text-primary",
            )}
          >
            {problem.title}
          </span>
          <span className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
            <span>دوره‌ی {course.title}</span>
            {/* Behavior modification has no fixed length, so its line says who it is for instead. */}
            <span>{course.kind === "behavior" ? "برای هر سن و هر نژاد" : describeSessions(course)}</span>
          </span>
        </span>

        {/* Phones get a thumbnail in place of the desktop preview. */}
        <img
          src={problem.photo}
          alt=""
          width={960}
          height={540}
          loading="lazy"
          className="size-16 shrink-0 rounded-xl object-cover lg:hidden"
        />
      </AccordionTrigger>

      {/*------ Details ------*/}
      {/* The accordion styles every link inside its panel as underlined text that turns light on hover; the buttons
          keep their own look, so each one restates its hover colour. */}
      <AccordionContent className="[&_a]:no-underline">
        <div className="grid gap-6 px-4 pb-6 sm:px-6">
          {/*------ What the Course Does ------*/}
          <div className="grid gap-4">
            <p className="max-w-prose text-base leading-relaxed text-pretty">{course.summary}</p>
            <ul className="grid gap-2">
              {course.highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-2.5">
                  <CheckIcon aria-hidden strokeWidth={2.4} className="size-4 shrink-0 text-primary" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          {/*------ Course Facts ------*/}
          <dl className="grid gap-x-6 gap-y-4 border-t border-primary/15 pt-5 sm:grid-cols-2">
            <Fact icon={ClockIcon} label="تعداد جلسه‌ها">
              {describeSessions(course)}
            </Fact>
            <Fact icon={CakeIcon} label="سن سگ">
              {describeAge(course)}
            </Fact>
            <Fact icon={MapPinIcon} label="محل آموزش">
              {describePlace(course)}
            </Fact>
            {course.prerequisite && (
              <Fact icon={KeyRoundIcon} label="پیش‌نیاز">
                {course.prerequisite}
              </Fact>
            )}
          </dl>

          {/*------ Next Step ------*/}
          {/* A new dog starts with the free assessment; behavior problems start from a request with a video, so the
              trainer has seen the behavior before the first session. */}
          <div className="flex flex-wrap items-center gap-3 border-t border-primary/15 pt-5">
            {course.kind === "behavior" ? (
              <Link
                to="/behavior-modification"
                className={buttonVariants({ size: "lg", className: "hover:text-primary-foreground!" })}
              >
                درخواست اصلاح رفتار
              </Link>
            ) : (
              <>
                <Link
                  to="/assessment"
                  className={buttonVariants({ size: "lg", className: "hover:text-primary-foreground!" })}
                >
                  ارزیابی رایگان رزرو کن
                </Link>
                <Link
                  to={`/courses/${course.slug}`}
                  className={buttonVariants({
                    size: "lg",
                    variant: "ghost",
                    className: "text-primary hover:text-primary!",
                  })}
                >
                  جزئیات دوره
                </Link>
              </>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/*===== Fact =====*/
function Fact({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon aria-hidden strokeWidth={1.7} className="mt-0.5 size-5 shrink-0 text-primary" />
      <div>
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="font-bold">{children}</dd>
      </div>
    </div>
  );
}

/*===== Course Preview =====*/
/**
 * Desktop-only photo of the active row's course. Every photo is stacked and only the active one is opaque, so
 * switching rows cross-fades instead of waiting for an image to load.
 */
function CoursePreview({ problems, active }: { problems: Problem[]; active: Problem }) {
  return (
    <figure aria-hidden className="sticky top-8 isolate hidden self-start lg:block">
      {/* A halo of gold light behind the photo, so the picture looks lit rather than pasted on the dark page. */}
      <div className="absolute -inset-10 -z-10 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-muted shadow-md">
        {problems.map((problem) => (
          <img
            key={problem.id}
            src={problem.photo}
            alt=""
            width={960}
            height={540}
            loading="lazy"
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-500",
              problem.id === active.id ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>
      <figcaption className="mt-4 flex items-baseline justify-between gap-4">
        <span className="font-extrabold">{active.course.title}</span>
        <span dir="ltr" className="shrink-0 text-sm text-muted-foreground">
          {active.course.latinName}
        </span>
      </figcaption>
    </figure>
  );
}
