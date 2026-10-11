import { Link } from "~/components/link";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Closing Banner =====*/
/**
 * The last ask on the page: a park photo with a deep bronze fade from the text side, so the headline stays readable
 * while the dogs stay visible. It asks the two kinds of visitor for their own next step: a new dog books the free
 * assessment, and a dog with a record here books its next course straight from its page.
 */
export function ClosingBanner() {
  return (
    <section aria-labelledby="closing-title" className="relative isolate site-container pt-section-md">
      {/* Gold light spilling out from behind the banner, so the last ask looks like the page's lit window. */}
      <div aria-hidden className="absolute inset-x-12 inset-y-0 -z-10 rounded-full bg-primary/25 blur-3xl" />
      <div className="relative flex min-h-96 items-center overflow-hidden rounded-4xl surface-inverse">
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
            قبل از هر دوره، {HEAD_TRAINER.firstName} سگت را می‌بیند
          </h2>
          <p className="text-lead text-pretty text-inverse-foreground/90">
            ارزیابی اول رایگان است. سگت قبلاً این‌جا دوره دیده؟ دوره‌ی بعدی‌اش را مستقیم رزرو کن.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              to="/assessment"
              className="inline-flex h-13 items-center rounded-2xl bg-saffron px-7 text-base font-extrabold text-saffron-foreground transition-colors hover:bg-saffron/90"
            >
              ارزیابی رایگان رزرو کن
            </Link>
            <Link
              to="/pets"
              className="inline-flex h-13 items-center rounded-2xl border border-inverse-foreground px-6 text-base font-bold text-inverse-foreground transition-colors hover:bg-inverse-foreground/10"
            >
              رزرو دوره‌ی بعدی
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
