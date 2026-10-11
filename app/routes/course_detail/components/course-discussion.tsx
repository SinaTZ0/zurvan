import { useEffect, useRef, useState } from "react";

import { HeroReviewDoodle } from "~/components/doodles";
import { Link } from "~/components/link";
import { SectionHeading } from "~/components/section-heading";
import { Stars } from "~/components/stars";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { DiscussionEntry, RatingSummary } from "~/routes/course_detail/discussion";

/** How many entries show before «نظرهای بیشتر». Enough to judge the course without a long scroll past it. */
const INITIAL_COUNT = 4;

const averageFormat = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
// Month and year only: the exact day of a review adds nothing, and it keeps the owner's visit less traceable.
const dateFormat = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long", year: "numeric" });

/*===== Course Discussion =====*/
/**
 * The course's reviews and questions in one ruled list, newest first. A review is an owner who finished the course; a
 * question can come from anyone before booking, so it carries a tag that says so. The head trainer's replies sit
 * under the entry in his own first-person voice.
 *
 * On desktop the heading, rating summary and ask button stay in a sticky start column beside the list. On phones they
 * stack in reading order and the ask button comes after the list, where the reader has just finished reading.
 */
export function CourseDiscussion({ entries, ratings }: { entries: DiscussionEntry[]; ratings: RatingSummary | null }) {
  const [expanded, setExpanded] = useState(false);
  const firstRevealedRef = useRef<HTMLElement>(null);

  const visibleEntries = expanded ? entries : entries.slice(0, INITIAL_COUNT);
  const remaining = entries.length - INITIAL_COUNT;

  /*------ Focus After Reveal ------*/
  // The button that was pressed unmounts, so without this keyboard focus would fall back to the top of the page.
  // Landing on the first new entry also lets a screen reader carry on reading from where the list was left.
  useEffect(() => {
    if (expanded) firstRevealedRef.current?.focus();
  }, [expanded]);

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-title"
      className="site-container grid scroll-mt-8 gap-10 pt-section-md lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-x-16"
    >
      {/*------ Start Column ------*/}
      <div className="flex flex-col gap-8 lg:sticky lg:top-8 lg:self-start">
        <SectionHeading
          id="reviews-title"
          title="نظرها و سؤال‌ها"
          description="نظر صاحبان سگ‌هایی که این دوره را گذرانده‌اند، و سؤال‌هایی که پیش از رزرو پرسیده‌اند."
        />
        {ratings && <RatingsSummary ratings={ratings} />}
        {/* Desktop's copy; phones get theirs after the list. */}
        <AskQuestion className="max-lg:hidden" />
      </div>

      {/*------ End Column ------*/}
      <div className="min-w-0">
        {entries.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ol className="divide-y border-y">
              {visibleEntries.map((entry, index) => (
                <li key={entry.id}>
                  <DiscussionItem entry={entry} itemRef={index === INITIAL_COUNT ? firstRevealedRef : undefined} />
                </li>
              ))}
            </ol>

            {!expanded && remaining > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className={buttonVariants({ variant: "ghost", className: "mt-4 text-primary hover:text-primary!" })}
              >
                نظرهای بیشتر ({formatNumberFa(remaining)} مورد دیگر)
              </button>
            )}
          </>
        )}

        <AskQuestion className="mt-10 lg:hidden" />
      </div>
    </section>
  );
}

/*===== Ratings Summary =====*/
/** Course and trainer averages as a short ruled list, like the trainer section's facts: no tiles, no bars. */
function RatingsSummary({ ratings }: { ratings: RatingSummary }) {
  const rows = [
    { term: "دوره", value: ratings.course },
    { term: "مربی", value: ratings.trainer },
  ];

  return (
    <div>
      <dl className="divide-y border-y">
        {rows.map(({ term, value }) => (
          <div key={term} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-4 py-3.5">
            <dt className="text-sm font-bold text-saffron-text">{term}</dt>
            <dd className="flex items-center gap-3">
              <span className="text-base font-extrabold">{averageFormat.format(value)}</span>
              {/* The stars show the rounded average; the exact one is the number beside them. */}
              <Stars rating={Math.round(value)} size="md" />
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted-foreground">از {formatNumberFa(ratings.count)} نظر</p>
    </div>
  );
}

/*===== Discussion Item =====*/
/** One review or question, with the head trainer's reply under it when there is one. */
function DiscussionItem({
  entry,
  itemRef,
}: {
  entry: DiscussionEntry;
  /** Set on the first entry a reader reveals, so focus can move to it. */
  itemRef?: React.Ref<HTMLElement>;
}) {
  const date = new Date(entry.date);

  return (
    <article
      ref={itemRef}
      // Focusable only by script (after «نظرهای بیشتر»), not part of the tab order.
      tabIndex={-1}
      className="py-6 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:py-7"
    >
      {/*------ Author ------*/}
      <header className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-extrabold text-primary"
        >
          {entry.author.charAt(0)}
        </span>
        <p className="min-w-0 font-bold">
          {entry.author}
          {entry.dog && `، همراه ${entry.dog}`}
        </p>
        {/* A question comes from someone who may not have taken the course; the tag tells the reader so. */}
        {entry.kind === "question" && (
          <span className="shrink-0 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">سؤال</span>
        )}
        <time dateTime={entry.date} className="ms-auto shrink-0 text-sm text-muted-foreground">
          {dateFormat.format(date)}
        </time>
      </header>

      {/*------ Rating ------*/}
      {entry.kind === "review" && (
        <div className="mt-3 flex items-center">
          <span className="sr-only">امتیاز این نظر به دوره:</span>
          <Stars rating={entry.courseRating} size="md" />
        </div>
      )}

      {/*------ Text ------*/}
      <p className="mt-3 max-w-prose text-base leading-8 text-pretty">{entry.text}</p>

      {/*------ Trainer's Reply ------*/}
      {entry.reply && (
        <div className="ms-6 mt-5 border-s-2 border-primary/50 ps-4 sm:ms-12">
          <p className="flex items-center gap-2.5">
            <img
              src={HEAD_TRAINER.photo.src}
              alt=""
              width={HEAD_TRAINER.photo.width}
              height={HEAD_TRAINER.photo.height}
              loading="lazy"
              className="size-8 shrink-0 rounded-full object-cover object-[70%_50%]"
            />
            <span className="font-bold text-primary">{HEAD_TRAINER.name}</span>
            <span className="text-sm text-muted-foreground">پاسخ مربی</span>
          </p>
          <p className="mt-2 max-w-prose text-base leading-8 text-pretty">{entry.reply.text}</p>
        </div>
      )}
    </article>
  );
}

/*===== Empty State =====*/
/**
 * A course nobody has written about yet. The page's one doodle lives here: a dog sitting by its ball, waiting, which
 * is the mood of an empty list that invites the first question.
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-start gap-5 border-y py-10">
      {/* Overrides the hero's responsive width, which `lg:w-[...]` would otherwise keep on desktop. */}
      <HeroReviewDoodle index={1} className="h-20 w-auto lg:w-auto" />
      <div>
        <p className="font-bold">هنوز کسی درباره‌ی این دوره چیزی ننوشته.</p>
        <p className="mt-1 text-muted-foreground">اولین سؤال را تو بپرس.</p>
      </div>
    </div>
  );
}

/*===== Ask Question =====*/
/** Asking needs an account, so the button goes to sign-in and the note says why before the reader gets there. */
function AskQuestion({ className }: { className: string }) {
  return (
    <div className={`flex flex-col items-stretch gap-3 lg:items-start ${className}`}>
      <Link to="/auth" className={buttonVariants({ variant: "outline", className: "w-full lg:w-auto" })}>
        سؤالت را بپرس
      </Link>
      <p className="text-sm text-pretty text-muted-foreground">
        برای پرسیدن، اول وارد شو. سؤال‌ها بعد از بررسی نمایش داده می‌شوند.
      </p>
    </div>
  );
}
