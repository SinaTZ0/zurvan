import { cn } from "cn";
import { BadgeCheckIcon, UndoDotIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { ReviewCard } from "~/routes/home/components/review-card";
import { REVIEWS } from "~/routes/home/reviews";

/*===== Scroll Choreography =====*/
// Progress runs 0 → 1 from the top of the page to the end of the hero's scroll runway.
/** The photo has filled the screen by this point. */
const EXPAND_END = 0.4;
/** Where each review pops in, after the photo has settled. The rest of the runway holds the finished scene. */
const REVEAL_AT = REVIEWS.map((_, index) => 0.44 + index * 0.1);
/** Reduced motion swaps the zoom for a cut at this point. */
const REDUCED_CUT = 0.2;

// Desktop places the cards in two staggered columns: each card spans two rows, the second column starts a row lower.
const DESKTOP_PLACEMENT = [
  "lg:col-start-1 lg:row-[1/span_2]",
  "lg:col-start-2 lg:row-[2/span_2]",
  "lg:col-start-1 lg:row-[3/span_2]",
  "lg:col-start-2 lg:row-[4/span_2]",
  "lg:col-start-1 lg:row-[5/span_2]",
];
/** Degrees each card settles at on desktop, so the pile reads as notes rather than a grid. */
const DESKTOP_TILT = [-2, 1.5, 1, -1.5, -1];

// The photo's starting frame, as insets from the pinned panel. Measured from the layout once mounted; these fallbacks
// only cover the moment before hydration, while the photo is still hidden.
const FRAME_CLIP =
  "inset(calc(var(--frame-top, 40%) * (1 - var(--expand, 0))) calc(var(--frame-right, 1rem) * (1 - var(--expand, 0))) calc(var(--frame-bottom, 6rem) * (1 - var(--expand, 0))) calc(var(--frame-left, 1rem) * (1 - var(--expand, 0))) round calc(1.75rem * (1 - var(--expand, 0))))";

/*===== Photo =====*/
const PHOTO = { src: "/demo/hero.webp", width: 2400, height: 1600 };
/** Between the man's face and the dog's head, as a fraction of the photo's height. The starting frame centres on it. */
const PHOTO_FOCUS_Y = 0.4;
/** The photo starts zoomed in and settles to 1 as it fills the screen. */
const PHOTO_START_SCALE = 1.15;

/*===== Home Hero =====*/
/**
 * A plain headline over a framed photo. Scrolling pins the hero: the photo grows until it fills the screen, covering
 * the headline as it shrinks and fades, then owners' reviews pop in over it one by one. The section's height is the
 * scroll runway for this; after it the page scrolls on as usual.
 *
 * Scroll position drives `--expand` on the panel directly, so the zoom never waits on React. Only the number of
 * revealed reviews goes through state, and it changes five times in the whole runway.
 */
export function HomeHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(0);
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    const section = sectionRef.current!;
    const panel = panelRef.current!;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // The page scrolled before the section reaches the top (the site header). Counting it lets the zoom start at
    // the very top of the page instead of after the header has gone.
    let sectionTop = 0;

    /*------ Measure ------*/
    const measure = () => {
      const panelBox = panel.getBoundingClientRect();
      const frameBox = frameRef.current!.getBoundingClientRect();
      panel.style.setProperty("--frame-top", `${frameBox.top - panelBox.top}px`);
      panel.style.setProperty("--frame-right", `${panelBox.right - frameBox.right}px`);
      panel.style.setProperty("--frame-bottom", `${panelBox.bottom - frameBox.bottom}px`);
      panel.style.setProperty("--frame-left", `${frameBox.left - panelBox.left}px`);
      panel.style.setProperty("--photo-shift", `${photoShift({ panelBox, frameBox })}px`);
      sectionTop = section.getBoundingClientRect().top + window.scrollY;
      setMeasured(true);
      update();
    };

    /*------ Update ------*/
    const update = () => {
      // The pin lets go once the page has scrolled past the header and the whole runway.
      const runway = section.offsetHeight - window.innerHeight;
      const progress = clamp(window.scrollY / (sectionTop + runway));
      const expand = reducedMotion.matches
        ? Number(progress >= REDUCED_CUT)
        : easeInOutCubic(clamp(progress / EXPAND_END));
      panel.style.setProperty("--expand", expand.toFixed(4));
      setRevealed(REVEAL_AT.filter((at) => progress >= at).length);
    };

    // The heading's height decides where the frame starts, and it changes with the viewport and once the font loads.
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(panel);
    resizeObserver.observe(headingRef.current!);
    // Lenis scrolls the window itself, so plain scroll events arrive once per eased frame.
    window.addEventListener("scroll", update, { passive: true });
    reducedMotion.addEventListener("change", update);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="hero-title" className="h-[300svh] lg:h-[340svh]">
      <div ref={panelRef} className="sticky top-0 flex h-svh flex-col overflow-hidden">
        {/*===== Heading =====*/}
        {/* Sits under the photo, so the growing frame covers it while it shrinks away. */}
        <div
          ref={headingRef}
          style={{
            opacity: "calc(1 - var(--expand, 0) * 1.6)",
            transform: "translateY(calc(var(--expand, 0) * -3rem)) scale(calc(1 - var(--expand, 0) * 0.08))",
          }}
          className="site-container origin-top pt-8 lg:pt-14"
        >
          <div className="grid gap-x-gutter gap-y-5 lg:grid-cols-[1.25fr_1fr] lg:items-end">
            <h1 id="hero-title" className="text-display text-balance">
              آموزش سگ و گربه، با مربیان تأییدشده
            </h1>

            <div className="lg:pb-3">
              <p className="max-w-xl text-lead text-muted-foreground">
                کلاس حضوری در تهران و کرج، یا آنلاین از خانه. جای حیوانت را رزرو کن و آنلاین پرداخت کن.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/courses" className={buttonVariants({ size: "lg" })}>
                  کلاس‌ها را ببین
                </Link>
                <Link to="/#trainers" className={buttonVariants({ size: "lg", variant: "outline" })}>
                  مربیان را بشناس
                </Link>
              </div>
            </div>
          </div>

          {/*------ Guarantees ------*/}
          <ul className="mt-6 hidden flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground sm:flex">
            <li className="flex items-center gap-2">
              <BadgeCheckIcon strokeWidth={1.7} className="size-5 shrink-0 text-primary" aria-hidden />
              ۴۲ مربی تأییدشده
            </li>
            <li className="flex items-center gap-2">
              <UndoDotIcon strokeWidth={1.7} className="size-5 shrink-0 text-primary" aria-hidden />
              کلاس شروع نشد؟ کل مبلغ برمی‌گردد
            </li>
          </ul>
        </div>

        {/*===== Frame =====*/}
        {/* An empty box that only marks where the photo starts. The bottom padding adds the header's height, so the
            frame's lower edge is on screen at the top of the page, before the header has scrolled away. */}
        <div className="site-container flex flex-1 flex-col pt-gutter pb-[calc(var(--spacing-gutter)+4rem)] lg:pb-[calc(var(--spacing-gutter)+5rem)]">
          <div ref={frameRef} className="flex-1" />
        </div>

        {/*===== Photo =====*/}
        {/* Covers the whole panel and is clipped back to the frame; `--expand` opens the clip to the screen's edges. */}
        <div
          style={{ clipPath: FRAME_CLIP }}
          className={cn(
            "absolute inset-0 z-10 transition-opacity duration-500",
            measured ? "opacity-100" : "opacity-0",
          )}
        >
          <img
            src={PHOTO.src}
            alt="مردی با پیراهن چهارخانه میان علف‌های بلند به دیوار تکیه داده و سگش کنارش نشسته است"
            width={PHOTO.width}
            height={PHOTO.height}
            fetchPriority="high"
            // Pans from the faces (inside the small frame) to the photo's centre as it grows, while zooming out.
            style={{
              transform: `translateY(calc(var(--photo-shift, 0px) * (1 - var(--expand, 0)))) scale(calc(${PHOTO_START_SCALE} - var(--expand, 0) * ${PHOTO_START_SCALE - 1}))`,
            }}
            // The man and his dog sit right of centre; tall phone crops keep them in view, and on desktop the open
            // grass on the left is where the review cards land.
            className="size-full object-cover object-[64%_50%]"
          />
          {/* Darkens where the cards land: the bottom on phones, the left on desktop. */}
          <div
            aria-hidden
            style={{ opacity: "var(--expand, 0)" }}
            className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent lg:bg-linear-to-r lg:from-black/55 lg:via-black/15"
          />
        </div>

        {/*===== Reviews =====*/}
        <section
          aria-labelledby="reviews-title"
          className="pointer-events-none absolute inset-0 z-20 site-container lg:flex lg:items-center lg:justify-end"
        >
          <h2 id="reviews-title" className="sr-only">
            نظر صاحبان حیوان‌ها
          </h2>
          {/* Phones stack the cards at the bottom like a deck, newest in front. Desktop gives each its own place. */}
          <ul className="absolute inset-x-site bottom-gutter sm:end-auto sm:w-md lg:static lg:grid lg:w-[40rem] lg:grid-cols-2 lg:gap-x-4 lg:gap-y-2">
            {REVIEWS.map((review, index) => {
              const shown = index < revealed;
              // How many cards have landed in front of this one in the phone deck.
              const depth = revealed - 1 - index;
              return (
                <li
                  key={review.id}
                  style={
                    {
                      "--depth": Math.max(depth, 0),
                      "--tilt": `${DESKTOP_TILT[index]}deg`,
                      zIndex: index,
                    } as React.CSSProperties
                  }
                  className={cn(
                    "absolute inset-x-0 bottom-0 origin-top transition-[opacity,translate,scale,rotate] duration-700 ease-silk motion-reduce:transition-opacity lg:static lg:self-center",
                    DESKTOP_PLACEMENT[index],
                    shown
                      ? "max-lg:translate-y-[calc(var(--depth)*-0.875rem)] max-lg:scale-[calc(1-var(--depth)*0.05)] lg:rotate-(--tilt)"
                      : "translate-y-10 scale-90 opacity-0",
                    // Deeper than two cards back, a phone card is fully hidden behind the ones in front.
                    shown && depth > 2 && "max-lg:opacity-0",
                  )}
                >
                  <ReviewCard review={review} />
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </section>
  );
}

/*===== Helpers =====*/
/**
 * How far to move the photo down (or up) so the starting frame shows its faces instead of its middle, which a short
 * frame would otherwise cut through. Clamped so the photo still covers the whole frame; the shift and the frame both
 * shrink linearly to nothing as the photo expands, so it stays covered all the way.
 */
function photoShift({ panelBox, frameBox }: { panelBox: DOMRect; frameBox: DOMRect }) {
  // The rendered photo: `object-cover` fills the panel, then the starting zoom scales it about the panel's centre.
  const coverScale = Math.max(panelBox.width / PHOTO.width, panelBox.height / PHOTO.height);
  const photoHeight = PHOTO.height * coverScale * PHOTO_START_SCALE;
  const panelCentre = panelBox.height / 2;
  const focus = panelCentre + (PHOTO_FOCUS_Y - 0.5) * photoHeight;
  const frameTop = frameBox.top - panelBox.top;
  const frameBottom = frameBox.bottom - panelBox.top;
  const wanted = (frameTop + frameBottom) / 2 - focus;
  // Keep the photo's top edge above the frame and its bottom edge below it.
  const min = frameBottom - (panelCentre + photoHeight / 2);
  const max = frameTop - (panelCentre - photoHeight / 2);
  return Math.min(Math.max(wanted, min), max);
}

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
