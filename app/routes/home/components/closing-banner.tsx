import { Link } from "~/components/link";

/*===== Closing Banner =====*/
/**
 * The last ask on the page: a park photo with a deep firuzeh fade from the text side, so the headline stays readable
 * while the dogs stay visible. Reassurance on cancelling sits right under the headline, where hesitation happens.
 */
export function ClosingBanner() {
  return (
    <section aria-labelledby="closing-title" className="site-container pt-section-md">
      <div className="surface-inverse relative flex min-h-96 items-center overflow-hidden rounded-4xl">
        <img
          src="/photo/cta-park.jpg"
          alt="زنی روی چمن پارک کنار دو سگ نشسته است"
          width={1400}
          height={934}
          loading="lazy"
          className="absolute inset-0 size-full object-cover object-[30%_60%]"
        />
        {/* Fades from the start edge, where the text is, to almost nothing at the far side. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-inverse/60 bg-linear-to-l from-inverse/95 from-30% via-inverse/55 via-60% to-inverse/5 sm:bg-transparent"
        />
        <div className="relative flex max-w-xl flex-col gap-4 p-8 sm:p-14">
          <h2 id="closing-title" className="text-h2 text-balance">
            اولین کلاس حیوانت را همین هفته رزرو کن
          </h2>
          <p className="text-lead text-pretty text-inverse-foreground/90">
            تا قطعی شدن کلاس، لغو رزرو همیشه با بازپرداخت کامل است.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="inline-flex h-13 items-center rounded-2xl bg-saffron px-7 text-base font-extrabold text-saffron-foreground transition-colors hover:bg-saffron/90"
            >
              کلاس‌ها را ببین
            </Link>
            <Link
              to="/trainers"
              className="inline-flex h-13 items-center rounded-2xl border border-inverse-foreground px-6 text-base font-bold text-inverse-foreground transition-colors hover:bg-inverse-foreground/10"
            >
              مربیان را بشناس
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
