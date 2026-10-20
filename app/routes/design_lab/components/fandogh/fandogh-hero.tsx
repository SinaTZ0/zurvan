import { Link } from "~/components/link";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { FandoghBubble } from "~/routes/design_lab/components/fandogh/fandogh-bubble";
import { LAB_LINKS } from "~/routes/design_lab/lab-content";

/*===== Fandogh Hero =====*/
/**
 * The page's one memorable moment: a white "picture book page" on the sky, and Fandogh far too big for it, his ears
 * over the top edge. The photo has a plain white background, so `mix-blend-multiply` makes the white vanish on the sky
 * where he leaves the page, while on the page itself (also white) there is nothing to hide.
 */
export function FandoghHero() {
  return (
    <section aria-labelledby="fd-hero-title" className="relative overflow-x-clip bg-[var(--fd-sky)] pb-14 sm:pb-20">
      {/*------ Clouds ------*/}
      <Cloud className="start-[6%] top-10 w-28 sm:w-44" />
      <Cloud className="end-[8%] top-28 w-20 sm:w-32" />

      <div className="relative mx-auto max-w-6xl px-4 pt-36 sm:px-6 sm:pt-40 lg:pt-48">
        <div className="relative grid items-center rounded-[2.5rem] bg-white px-6 pt-40 pb-10 shadow-[0_8px_0_0_rgba(29,26,23,0.12)] sm:px-12 lg:grid-cols-[1.15fr_1fr] lg:gap-6 lg:pt-14 lg:pb-14">
          {/*------ Words ------*/}
          <div className="order-2 lg:order-1">
            <FandoghBubble tone="sky" tail="top-end" className="fd-pop max-w-md">
              ببین چه گوش‌هایی دارم! همه‌چیز را می‌شنوم؛ حتی صدای باز شدن بسته‌ی خوراکی تو را.
            </FandoghBubble>
            <h1
              id="fd-hero-title"
              className="mt-8 font-['Lalezar'] text-5xl leading-[1.25] text-[var(--fd-ink)] sm:text-6xl lg:text-7xl"
            >
              سلام! من فندقم؛
              <br />
              بیا با هم یاد بگیریم
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--fd-ink)]/85">
              اینجا زروان است، مجموعه‌ی تربیتی سگ‌ها. مربی‌ام {HEAD_TRAINER.name} است و تازه‌ترین دوستانش را اول از همه
              رایگان ارزیابی می‌کند.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={LAB_LINKS.evaluation}
                className="rounded-full bg-[var(--fd-leaf-deep)] px-8 py-4 text-lg font-bold text-white outline-offset-4 transition-colors hover:bg-[var(--fd-ink)] focus-visible:outline-2 focus-visible:outline-[var(--fd-ink)]"
              >
                ارزیابی رایگان
              </Link>
              <Link
                to={LAB_LINKS.courses}
                className="rounded-full px-4 py-3 text-base font-semibold text-[var(--fd-ink)] underline decoration-[var(--fd-fawn)] decoration-4 underline-offset-8 outline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--fd-ink)]"
              >
                دوره‌ها را ببین
              </Link>
            </div>
          </div>

          {/*------ Breaking out of the page ------*/}
          <div className="absolute inset-x-0 -top-32 flex justify-center lg:static lg:order-2 lg:-mt-80 lg:-mb-20 lg:justify-end">
            <img
              src="/photo/design-lab/fandogh-1.webp"
              alt="فندق، سگ مالینوآی کارتونی با گوش‌های بزرگ، دستش را برای سلام بالا برده است"
              width={610}
              height={610}
              fetchPriority="high"
              className="fd-rise size-72 mix-blend-multiply [filter:brightness(1.05)] sm:size-[22rem] lg:size-[34rem]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/*===== Cloud =====*/
function Cloud({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 50" className={`absolute fill-white/70 ${className}`}>
      <path d="M20 46a16 16 0 0 1-1-32 22 22 0 0 1 42-6 18 18 0 0 1 30 12 14 14 0 0 1 7 26z" />
    </svg>
  );
}
