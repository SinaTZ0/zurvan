import { cn } from "cn";
import { BadgeCheckIcon, UndoDotIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { HeroDoodles, HeroReviewDoodle, HeroSideDoodles } from "~/routes/home/components/hero-doodles";
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
/** Degrees each card settles at, so the pile reads as notes rather than a grid. */
const TILT = [-2, 1.5, 1, -1.5, -1];
// Where each card's doodle pops in on desktop, wherever the pile leaves the photo free: perched on the first card of
// each column, off the outer side of the middle card, and under the last card of each column.
const DESKTOP_DOODLE_PLACEMENT = [
  "lg:bottom-full lg:end-8 lg:-mb-0.5 lg:origin-bottom",
  "lg:bottom-full lg:start-10 lg:-mb-0.5 lg:origin-bottom",
  "lg:-top-8 lg:-start-20 lg:origin-left",
  "lg:top-full lg:end-10 lg:mt-3 lg:origin-top",
  "lg:top-full lg:start-12 lg:mt-2 lg:origin-top",
];

// The photo's starting frame, as insets from the pinned panel. Measured from the layout once mounted; these fallbacks
// only cover the moment before hydration, while the photo is still hidden.
const FRAME_CLIP =
  "inset(calc(var(--frame-top, 40%) * (1 - var(--expand, 0))) calc(var(--frame-right, 1rem) * (1 - var(--expand, 0))) calc(var(--frame-bottom, 6rem) * (1 - var(--expand, 0))) calc(var(--frame-left, 1rem) * (1 - var(--expand, 0))) round calc(1.75rem * (1 - var(--expand, 0))))";

/*===== Side Doodles =====*/
/** Grows with the margin, from the frieze's stroke scale at the narrowest margin that shows it, up to a cap. */
const SIDE_DOODLE_SIZE = "h-auto w-[clamp(15.625rem,calc((100vw-80rem)/2-4rem),22rem)] shrink-0";

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

          <div className="mt-5 flex items-end gap-x-8 sm:mt-8">
            {/*------ Guarantees ------*/}
            <ul className="hidden shrink-0 flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground sm:flex">
              <li className="flex items-center gap-2">
                <BadgeCheckIcon strokeWidth={1.7} className="size-5 shrink-0 text-primary" aria-hidden />
                ۴۲ مربی تأییدشده
              </li>
              <li className="flex items-center gap-2">
                <UndoDotIcon strokeWidth={1.7} className="size-5 shrink-0 text-primary" aria-hidden />
                کلاس شروع نشد؟ کل مبلغ برمی‌گردد
              </li>
            </ul>

            {/*------ Doodles ------*/}
            {/* Fills the rest of the row. From `sm` the frieze rises out of the short guarantees row into the empty
                space beside the buttons, and dips into the gap above the photo, instead of making the heading taller.
                The cropped tail fades out at the start edge rather than ending in a half-drawn figure; `mask-no-clip`
                lets that fade reach the part of the frieze above and below this box. */}
            <div className="relative h-16 min-w-0 flex-1 self-stretch overflow-x-clip mask-r-from-[calc(100%-3rem)] mask-no-clip sm:h-auto">
              <HeroDoodles className="absolute end-0 bottom-0 h-16 w-auto sm:-bottom-4 sm:h-20" />
            </div>
          </div>
        </div>

        {/*===== Side Doodles =====*/}
        {/* Wide screens leave empty margins beside the page, as tall as the hero. Each holds a scene pinned to the
            page's edge; when the margin is narrower than the scene, it overflows toward the screen's edge, where it
            is cropped and faded. Laid out left to right, so `justify-end` means the right edge in Persian too. They
            fade with the heading, and the growing photo covers them. */}
        <div
          dir="ltr"
          style={{ opacity: "calc(1 - var(--expand, 0) * 1.6)" }}
          className="pointer-events-none absolute inset-0 hidden min-[100rem]:block"
        >
          <div className="absolute inset-y-0 left-0 flex w-[calc((100%-var(--container-page))/2)] items-start justify-end overflow-hidden mask-l-from-[calc(100%-6rem)] pt-10 pr-8">
            <HeroSideDoodles side="left" className={SIDE_DOODLE_SIZE} />
          </div>
          <div className="absolute inset-y-0 right-0 flex w-[calc((100%-var(--container-page))/2)] items-start overflow-hidden mask-r-from-[calc(100%-6rem)] pt-10 pl-8">
            <HeroSideDoodles side="right" className={SIDE_DOODLE_SIZE} />
          </div>
        </div>

        {/*===== Frame =====*/}
        {/* Marks where the photo starts. The bottom padding adds the header's height, so the frame's lower edge is on
            screen at the top of the page, before the header has scrolled away. Until the photo is measured into place
            (it needs the heading's final height, which isn't known on the server), the frame is a soft placeholder in
            exactly its spot, so the page never has a hole and the photo fades in over it without moving. */}
        <div className="site-container flex flex-1 flex-col pt-gutter pb-[calc(var(--spacing-gutter)+4rem)] lg:pb-[calc(var(--spacing-gutter)+5rem)]">
          <div
            ref={frameRef}
            className={cn(
              "flex-1 rounded-[1.75rem] transition-colors duration-700 ease-silk",
              measured ? "bg-transparent" : "bg-sunken",
            )}
          />
        </div>

        {/*===== Photo =====*/}
        {/* Covers the whole panel and is clipped back to the frame; `--expand` opens the clip to the screen's edges. */}
        <div
          style={{ clipPath: FRAME_CLIP }}
          className={cn(
            "absolute inset-0 z-10 transition-opacity duration-700 ease-silk motion-reduce:transition-none",
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
          {/* Phones run the cards top to bottom in a zig-zag. The spacer below the list keeps it at the top while it
              fits; once it outgrows the screen the spacer is gone and `justify-end` lets it overflow upward instead,
              so the newest card stays in view. Desktop gives each card its own place in a two-column pile. */}
          <div className="absolute inset-x-site top-gutter bottom-gutter flex flex-col justify-end sm:end-auto sm:w-md lg:contents">
            <ul className="flex shrink-0 flex-col lg:grid lg:w-[40rem] lg:grid-cols-2 lg:gap-x-4 lg:gap-y-2">
              {REVIEWS.map((review, index) => {
                const shown = index < revealed;
                return (
                  <li
                    key={review.id}
                    style={{ "--tilt": `${TILT[index]}deg`, zIndex: index } as React.CSSProperties}
                    className={cn(
                      // On phones the row opens from nothing, so the list grows smoothly as each card lands.
                      "grid-rows-[0fr] transition-[opacity,translate,scale,rotate,grid-template-rows] duration-700 ease-silk motion-reduce:transition-opacity max-lg:grid max-lg:w-[82%] max-lg:odd:self-start max-lg:even:self-end lg:self-center",
                      DESKTOP_PLACEMENT[index],
                      shown ? "rotate-(--tilt) grid-rows-[1fr]" : "translate-y-10 scale-90 opacity-0",
                    )}
                  >
                    <div className="relative min-h-0 max-lg:pb-3">
                      <ReviewCard review={review} />

                      {/*------ Doodle ------*/}
                      {/* Mounts with its card, so it pops and draws in as the card lands. On phones it sits in the gap
                          the zig-zag leaves beside the card. */}
                      {shown && (
                        <div
                          className={cn(
                            "absolute animate-in duration-500 zoom-in-50 fade-in motion-reduce:animate-none max-lg:top-6",
                            index % 2 === 0 ? "max-lg:start-full max-lg:ms-1" : "max-lg:end-full max-lg:me-1",
                            DESKTOP_DOODLE_PLACEMENT[index],
                          )}
                        >
                          <HeroReviewDoodle index={index} />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="grow lg:hidden" />
          </div>
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
