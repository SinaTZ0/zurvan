import { cn } from "cn";
import { useLenis } from "lenis/react";
import Snap from "lenis/snap";
import { motion, useMotionTemplate, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { formatNumberFa } from "~/lib/digits";
import { LAB_SERVICES } from "~/routes/design_lab/lab-content";
import { Bubble, Cut, HEADING } from "~/routes/design_lab/components/story/story-parts";
import { GRAIN } from "~/routes/design_lab/components/story/story-theme";
import type { CutName } from "~/routes/design_lab/components/story/story-parts";

/*===== Content =====*/
// What each service opens into. A draft from docs/zurvan-courses.md (the course cards and the owner's notes) for the
// owner to check: no prices, session counts or promises the cards don't make.
type ServiceTitle = (typeof LAB_SERVICES)[number]["title"];

// `rise` is the pose's height against the standing ones, so every pose is drawn at one scale and the lying dog
// doesn't swell to a standing dog's height.
// `bubbleAt` places the wide-screen bubble by the head when the default (up and to the right) doesn't fit the pose.
const TEACH: Record<
  ServiceTitle,
  { points: readonly string[]; pose: CutName; rise: number; says: string; bubbleAt?: string }
> = {
  "آموزش پایه و پیشرفته": {
    points: [
      "از نام، بشین، بایست و خواب تا هم‌قدم، بمون و بیا.",
      "در سطح حرفه‌ای: ماندن طولانی، هم‌قدم حرفه‌ای و فرمان‌پذیری در بیرون.",
      "از دو ماهگی می‌شود شروع کرد.",
    ],
    pose: "teach-basic",
    rise: 0.98,
    says: "بشین؟ بلدم! بعدی چیه؟",
  },
  "رفتارشناسی و اصلاح رفتار": {
    points: [
      "پرخاشگری، گاز گرفتن، اضطراب جدایی، خطای دستشویی و آشغال‌خواری.",
      "اول ریشه‌ی رفتار را می‌شناسیم، بعد با هم درستش می‌کنیم.",
      "برای هر سن و هر نژادی.",
    ],
    pose: "teach-calm",
    rise: 0.54,
    // Lying flat, his head is low and far right: the bubble goes above it, not past the plate's edge.
    bubbleAt: "bottom-[96%] left-[34%]",
    says: "دیگه کفش‌ها رو نمی‌جوم. قول!",
  },
  "آموزش تخصصی": {
    points: [
      "نگهبان محل، بادی‌گارد، سگ سرویس و سگ آلارم.",
      "ردیابی: زنده‌یاب و موادیاب.",
      "برنامه‌ی هر سگ بعد از ارزیابی چیده می‌شود.",
    ],
    pose: "teach-work",
    rise: 1,
    says: "آماده‌ی کارم!",
  },
  "آمادگی برای مسابقات داخلی و بین‌المللی": {
    points: ["آمادگی برای آزمون‌های BH، IGP ۱ تا ۳، FH و WUSV.", "تمرین منظم ردیابی، اطاعت و محافظت، تا روز مسابقه."],
    pose: "teach-medal",
    rise: 0.98,
    says: "تمرین امروز، مدال فردا!",
  },
  "مشاوره‌ی تخصصی قبل و بعد از آموزش": {
    points: [
      "قبل از شروع: کدام دوره، از کجا و با چه هدفی.",
      "بعد از آموزش: راهنمایی برای این‌که تمرین‌ها در خانه ادامه پیدا کنند.",
      "قدم اول همیشه یک ارزیابی رایگان است.",
    ],
    pose: "teach-advice",
    rise: 0.99,
    says: "سؤال داری؟ گوش می‌دم.",
  },
};

const ITEMS = LAB_SERVICES.map((service) => ({ ...service, ...TEACH[service.title] }));

// The garland across the top of the plate: pennants hung along a sagging string (Q 200 46), each turned to the string.
// Every third is gold, the rest a tint of the ink.
const PENNANTS = [
  "M25.4 10.8L41.2 13.4L30.0 31.8Z",
  "M58.7 16.1L74.6 18.2L64.0 36.9Z",
  "M92.0 20.2L108.0 21.8L98.0 40.9Z",
  "M125.4 23.2L141.3 24.3L132.0 43.7Z",
  "M158.7 25.2L174.7 25.7L166.0 45.4Z",
  "M192.0 26.0L208.0 26.0L200.0 46.0Z",
  "M225.3 25.7L241.3 25.2L234.0 45.4Z",
  "M258.7 24.3L274.6 23.2L268.0 43.7Z",
  "M292.0 21.8L308.0 20.2L302.0 40.9Z",
  "M325.4 18.2L341.3 16.1L336.0 36.9Z",
  "M358.8 13.4L374.6 10.8L370.0 31.8Z",
] as const;

// Each item after the first owns this much scroll while the section is pinned. Less than a screen, so five items
// don't feel like a chore; the section is one screen plus four steps tall.
const STEP_SVH = 85;

/*===== Fluid Type =====*/
// The panel is exactly one screen, so its type follows the screen's width and height, whichever runs out first:
// a wide but short laptop (1366×768 leaves about 650px) gets smaller headings instead of an open service running off
// the bottom. Each size is clamped between its phone and big-screen sizes, and the middle term keeps a rem part so
// browser zoom still enlarges it (a font sized only in vw/svh ignores zoom).
const FLUID = {
  title: "clamp(1.875rem, calc(0.75rem + min(3.2vw, 5.5svh)), 3.75rem)",
  intro: "clamp(1rem, calc(0.75rem + min(0.5vw, 0.9svh)), 1.125rem)",
  service: "clamp(1.5rem, calc(0.5rem + min(2.6vw, 4.4svh)), 3rem)",
  detail: "clamp(1rem, calc(0.75rem + min(0.6vw, 1.1svh)), 1.25rem)",
  points: "clamp(0.875rem, calc(0.625rem + min(0.6vw, 1.1svh)), 1.125rem)",
  gap: "clamp(0.375rem, min(0.8vw, 1.2svh), 0.75rem)",
} as const;

/*===== Reduced Motion =====*/
// Read through an external store so the server and the hydrating render agree (the pinned version), then the
// browser's real setting takes over.
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduce(listener: () => void) {
  const query = window.matchMedia(REDUCE_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReduce,
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false,
  );
}

/*===== Snap =====*/
/**
 * After the visitor stops scrolling inside the pinned stretch, Lenis eases the page to the nearest item, so an item
 * is never left half-way. Proximity only: a stop far from any item (or outside the section) stays where it is.
 * The points are absolute scroll positions, so they're placed again when the layout changes size.
 */
function useStepSnap({ section, enabled }: { section: React.RefObject<HTMLElement | null>; enabled: boolean }) {
  const lenis = useLenis();

  useEffect(() => {
    const element = section.current;
    if (!lenis || !enabled || !element) return;

    const snap = new Snap(lenis, { type: "proximity", distanceThreshold: "30%", duration: 0.7, debounce: 220 });
    let removers: (() => void)[] = [];

    function place() {
      if (!element) return;
      for (const remove of removers) remove();
      const top = element.getBoundingClientRect().top + window.scrollY;
      const step = (element.offsetHeight - window.innerHeight) / (ITEMS.length - 1);
      removers = ITEMS.map((_, index) => snap.add(Math.round(top + index * step)));
    }

    place();
    const observer = new ResizeObserver(place);
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      snap.destroy();
    };
  }, [lenis, enabled, section]);
}

/*===== Step Count =====*/
/** «۳ از ۵»: where the visitor is in the pinned stretch. Decorative; the open item already says it. */
function StepCount({ shown, className }: { shown: number; className?: string }) {
  return (
    <p aria-hidden className={cn("shrink-0 font-display text-(--st-ink)/55 tabular-nums", className)}>
      <span className="text-(--st-ink)">{formatNumberFa(shown + 1)}</span> از {formatNumberFa(ITEMS.length)}
    </p>
  );
}

/*===== Service Title =====*/
/**
 * A service's heading, big when its service is open. Growing it by font size re-wraps the words on every frame, so
 * the heading is always laid out at the open size (its line breaks never change) and a closed one is scaled down from
 * its start corner. A transform doesn't shrink the box, so the wrapper's height follows the measured heading times
 * the same factor. `--closed` is the closed size over the open one; the open size is fluid (FLUID.service), so the
 * ratio steps by width only, keeping closed headings readable on phones and quiet on wide screens.
 */
function ServiceTitle({ title, open }: { title: string; open: boolean }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;
    // offsetHeight ignores the transform, so it's always the open height.
    const observer = new ResizeObserver(() => setHeight(heading.offsetHeight));
    observer.observe(heading);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={height === undefined ? undefined : ({ "--h": `${height}px` } as React.CSSProperties)}
      className={cn(
        "transition-[height] duration-500 [--closed:.667] motion-reduce:transition-none md:[--closed:.6] xl:[--closed:.5]",
        height !== undefined && (open ? "h-(--h)" : "h-[calc(var(--h)*var(--closed))]"),
      )}
    >
      {/* The page is RTL, so the start corner is the top right. */}
      <h3
        ref={headingRef}
        style={{ fontSize: FLUID.service }}
        className={cn(
          "origin-top-right font-display leading-[1.25] font-bold text-balance transition-[scale,color] duration-500 motion-reduce:transition-none",
          open ? "text-(--st-ink)" : "scale-(--closed) text-(--st-ink)/45",
        )}
      >
        {title}
      </h3>
    </div>
  );
}

/*===== Story Teach =====*/
/**
 * «چه چیزی یاد می‌دهیم؟» as a pinned scroll scene: the panel grows from a card to the whole screen as it arrives,
 * then holds while each service opens in turn and Fandogh changes pose for it. With reduced motion it's a plain
 * section with every service open.
 */
export function StoryTeach() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const pinned = !reduced;
  const [active, setActive] = useState(0);

  /*------ Arrival: card to full screen ------*/
  // From the panel's top entering at the bottom of the screen to it reaching the top, where it pins.
  const { scrollYProgress: arrival } = useScroll({ target: sectionRef, offset: ["start end", "start start"] });
  const insetY = useTransform(arrival, [0.25, 1], [6, 0]);
  const insetX = useTransform(arrival, [0.25, 1], [5, 0]);
  const radius = useTransform(arrival, [0.25, 1], [32, 0]);
  const clipPath = useMotionTemplate`inset(${insetY}svh ${insetX}vw round ${radius}px)`;

  /*------ Steps: which service is open ------*/
  const { scrollYProgress: steps } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  useMotionValueEvent(steps, "change", (progress) => {
    setActive(Math.min(ITEMS.length - 1, Math.max(0, Math.round(progress * (ITEMS.length - 1)))));
  });

  useStepSnap({ section: sectionRef, enabled: pinned });

  const shown = pinned ? active : 0;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="st-teach-title"
      style={pinned ? { height: `calc(100svh + ${(ITEMS.length - 1) * STEP_SVH}svh)` } : undefined}
      className="relative"
    >
      <div className={cn(pinned && "sticky top-0 h-svh")}>
        <motion.div
          // Remounted when the mode changes: the server renders the pinned card, and motion keeps a style it has bound
          // to a motion value even after the prop is gone.
          key={pinned ? "pinned" : "plain"}
          style={pinned ? { clipPath } : undefined}
          className={cn("bg-(--st-paper-2)", pinned ? "absolute inset-0" : "py-16")}
        >
          <div className="mx-auto grid h-full max-w-[88rem] grid-rows-[auto_auto_1fr] gap-x-10 px-4 pt-[max(1.25rem,4svh)] pb-24 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-[auto_1fr] lg:pb-20 xl:gap-x-16">
            {/* Sizes are fluid (FLUID); on short wide screens the intro is dropped too, as the open service needs the room. */}
            {/*------ Title ------*/}
            <header>
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="st-teach-title" style={{ fontSize: FLUID.title }} className={HEADING}>
                  چه چیزی یاد می‌دهیم؟
                </h2>
                {/* On phones the plate is too short for a page number beside the bubble, so it sits here. */}
                {pinned && <StepCount shown={shown} className="text-base md:text-lg lg:hidden" />}
              </div>
              <p
                style={{ fontSize: FLUID.intro }}
                className="mt-3 hidden max-w-[28em] leading-[1.75] text-(--st-ink)/70 md:block lg:[@media(max-height:46rem)]:hidden"
              >
                مهارت‌های کاربردی، سگی آرام‌تر و شادتر، و رابطه‌ای محکم‌تر. برای همه‌ی نژادها و سنین.
              </p>
            </header>

            {/*------ The plate: Fandogh's training yard, one pose per service ------*/}
            {/* The panel reads as an open picture book: the text page on one side, this illustrated plate on the
                other, full height, with the step count as its page number. On phones it's a short stage above the
                list (shorter still on short phones), with him to the left and the bubble beside him. */}
            <div
              aria-hidden
              style={{ backgroundImage: GRAIN }}
              className={cn(
                "relative mt-4 h-[26svh] overflow-hidden rounded-[1.5rem] border-2 border-(--st-line)/10 bg-(--st-paper) max-lg:[@media(max-height:44rem)]:h-[20svh]",
                "lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:h-auto lg:rounded-[2.5rem]",
                // Unpinned, the list runs long: the plate stays in view beside it instead of stretching down it.
                !pinned && "lg:sticky lg:top-8 lg:h-[36rem] lg:self-start",
              )}
            >
              {/*------ Scenery ------*/}
              {/* No sky objects: the black is the site's own colour, not night. A garland of pennants is strung across
                  the top, as over a yard on a training day, above two lines of hills, the far one fainter: tints of the
                  ink on the plate, so they work in any palette. Wide screens only, as the phone stage is too short. */}
              <svg viewBox="0 0 400 50" className="absolute inset-x-0 top-[11%] hidden w-full lg:block">
                <path
                  d="M0 6 Q200 46 400 6"
                  fill="none"
                  strokeWidth={1.5}
                  className="stroke-[color-mix(in_srgb,var(--st-ink)_22%,var(--st-paper))]"
                />
                {PENNANTS.map((d, index) => (
                  <path
                    key={d}
                    d={d}
                    className={cn(
                      "st-pennant",
                      index % 3 === 1
                        ? "fill-[color-mix(in_srgb,var(--st-red)_60%,var(--st-paper))]"
                        : "fill-[color-mix(in_srgb,var(--st-ink)_14%,var(--st-paper))]",
                    )}
                  />
                ))}
              </svg>
              <svg
                viewBox="0 0 400 100"
                preserveAspectRatio="none"
                className="absolute inset-x-0 bottom-0 hidden h-[44%] w-full lg:block"
              >
                <path
                  d="M0 30 C50 10 100 12 150 26 S260 4 320 20 S380 22 400 14 V100 H0 Z"
                  className="fill-[color-mix(in_srgb,var(--st-ink)_5%,var(--st-paper))]"
                />
                <path
                  d="M0 58 C70 36 120 40 180 54 S290 30 345 44 S390 46 400 40 V100 H0 Z"
                  className="fill-[color-mix(in_srgb,var(--st-ink)_9%,var(--st-paper))]"
                />
              </svg>
              <Cut name="hedge" className="st-sway absolute bottom-[3%] -left-[6%] hidden w-[44%] lg:block" />
              <Cut name="hedge" className="st-sway-2 absolute -right-[6%] bottom-[3%] hidden w-[40%] -scale-x-100 lg:block" />
              <Cut
                name="ground"
                className="absolute bottom-[3%] left-[2%] w-56 md:w-80 lg:bottom-[6%] lg:left-1/2 lg:w-[66%] lg:-translate-x-1/2"
              />
              <Cut name="plants" className="st-sway absolute -bottom-[3%] -left-[3%] hidden w-[22%] lg:block" />
              <Cut name="plants" className="st-sway-2 absolute -right-[3%] -bottom-[3%] w-24 -scale-x-100 md:w-32 lg:w-[20%]" />

              {pinned && (
                <StepCount shown={shown} className="absolute top-7 right-8 hidden text-lg lg:block xl:text-xl" />
              )}

              {/*------ Poses ------*/}
              {ITEMS.map((item, index) => {
                const on = index === shown;
                // Out first, then in: the old pose has faded before the new one appears, and the bubble follows it.
                const bubble = {
                  initial: false,
                  animate: { opacity: on ? 1 : 0, scale: on ? 1 : 0.92 },
                  transition: { duration: 0.3, delay: on ? 0.45 : 0 },
                } as const;
                return (
                  <div
                    key={item.title}
                    className="absolute bottom-[6%] left-[2%] flex h-[80%] w-56 items-end justify-center md:w-80 lg:inset-x-0 lg:bottom-[9%] lg:h-[60%] lg:max-h-[30rem] lg:w-auto"
                  >
                    <motion.div
                      initial={false}
                      animate={{ opacity: on ? 1 : 0, y: on ? 0 : 10 }}
                      transition={{ duration: 0.3, delay: on ? 0.28 : 0 }}
                      style={{ height: `${item.rise * 100}%` }}
                      className="relative flex max-w-full justify-center"
                    >
                      <Cut name={item.pose} className="st-breathe h-full w-auto max-w-full object-contain object-bottom" />
                      {/* On wide screens the bubble sits by his head (he faces right); on phones it's past him, in the plate's free corner. */}
                      <motion.div
                        {...bubble}
                        className={cn(
                          "absolute hidden origin-bottom-left lg:block",
                          item.bubbleAt ?? "bottom-[86%] left-[64%]",
                        )}
                      >
                        <Bubble tail="left" className="st-float xl:px-5 xl:py-3 xl:text-xl">
                          {item.says}
                        </Bubble>
                      </motion.div>
                    </motion.div>
                    <motion.div
                      {...bubble}
                      className="absolute top-[4%] left-[calc(100%-1.75rem)] origin-bottom-left lg:hidden"
                    >
                      <Bubble tail="left" className="st-float max-w-[8.5rem] md:max-w-none">
                        {item.says}
                      </Bubble>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            {/*------ The services; the one in view is open ------*/}
            <div className="relative mt-6 lg:mt-8 lg:self-center">
              {/* The rail: its gold fill follows the scroll through the pinned stretch. */}
              {pinned && (
                <div aria-hidden className="absolute inset-y-0 start-0 w-0.5 bg-(--st-line)/15">
                  <motion.div style={{ scaleY: steps }} className="h-full w-full origin-top bg-(--st-red)" />
                </div>
              )}
              <ul className={cn(pinned && "ps-5 md:ps-7")}>
                {ITEMS.map((item, index) => {
                  const open = !pinned || index === active;
                  return (
                    <li key={item.title} style={{ paddingBlock: FLUID.gap }}>
                      <ServiceTitle title={item.title} open={open} />
                      {/* Collapsed by grid rows, not unmounted, so every service stays readable to a screen reader. */}
                      <div
                        className={cn(
                          "grid transition-[grid-template-rows,opacity] duration-500 motion-reduce:transition-none",
                          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                        )}
                      >
                        <div className="overflow-hidden">
                          <p
                            style={{ fontSize: FLUID.detail }}
                            className="pt-[0.75em] leading-[1.75] text-(--st-ink)/85"
                          >
                            {item.detail}
                          </p>
                          <ul
                            style={{ fontSize: FLUID.points }}
                            className="mt-3 space-y-1.5 pb-2 leading-[1.75] text-(--st-ink)/70 max-lg:[@media(max-height:44rem)]:hidden"
                          >
                            {item.points.map((point) => (
                              <li key={point} className="flex gap-2.5">
                                <span aria-hidden className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-(--st-red)" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
