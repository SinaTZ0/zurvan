import { Link } from "~/components/link";

import { FOCUS_RING, Grain, POSTER_FONT } from "./saye-parts";
import { SayeHeader } from "./saye-header";

/*===== Hero =====*/
// The memorable element: the two-colour head print blown up past the viewport edge. The photo's background is exactly
// the field's fawn, so the mark has no edge of its own and the page edge is what crops it. It is scaled to ~880px at
// most, so the 610px source's softness reads as ink spread rather than a low-res image.

export function SayeHero() {
  return (
    <section aria-labelledby="sy-hero-title" className="relative overflow-hidden bg-[var(--sy-fawn)] text-black">
      <SayeHeader />

      <div className="relative lg:min-h-[calc(100svh-6rem)]">
        {/*------ Headline ------*/}
        <div className="relative z-10 px-4 pb-2 sm:px-8 lg:absolute lg:inset-y-0 lg:start-0 lg:mt-0 lg:flex lg:w-[56%] lg:flex-col lg:justify-center lg:px-12 lg:pb-16">
          <h1
            id="sy-hero-title"
            className={`${POSTER_FONT} text-[clamp(4.5rem,22vw,8rem)] leading-[0.9] lg:text-[clamp(6rem,11.5vw,12rem)]`}
          >
            من سایه‌ام.
          </h1>
          <p
            className={`${POSTER_FONT} mt-3 text-[clamp(1.75rem,7vw,2.5rem)] leading-tight lg:text-[clamp(2rem,3.4vw,3.5rem)]`}
          >
            کنار دستت می‌مانم.
          </p>
          <p className="mt-6 max-w-[30ch] text-lg leading-8 font-bold sm:text-xl">
            سگت را بیاور. اول ارزیابی رایگان، بعد تمرین.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              to="/assessment"
              className={`${POSTER_FONT} bg-black px-8 py-3 text-2xl text-[var(--sy-fawn)] hover:bg-[var(--sy-paper)] hover:text-black sm:text-3xl ${FOCUS_RING}`}
            >
              ارزیابی رایگان
            </Link>
            <Link to="/courses" className={`text-base font-bold underline underline-offset-8 ${FOCUS_RING}`}>
              دوره‌ها را ببین
            </Link>
          </div>
        </div>

        {/*------ Head mark ------*/}
        <div className="pointer-events-none relative h-[92vw] overflow-hidden lg:absolute lg:inset-y-0 lg:end-0 lg:mt-0 lg:h-auto lg:w-[62%]">
          <img
            src="/photo/design-lab/saye-head.webp"
            width={610}
            height={610}
            alt="سایه؛ نقش دو رنگ سر یک مالینوا، سیاه روی زرد"
            fetchPriority="high"
            className="absolute -end-[22vw] top-[6vw] w-[118vw] max-w-none [image-rendering:auto] lg:-end-[10%] lg:top-[3%] lg:w-[min(860px,60vw)]"
          />
        </div>
      </div>

      <Grain />
    </section>
  );
}
