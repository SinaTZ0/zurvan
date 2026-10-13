import { cn } from "cn";
import { PauseIcon, PlayIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { ChalkDoodle } from "~/routes/home/components/chalk-doodle";
import { SpeechBubble } from "~/routes/home/components/speech-bubble";

/*===== Slides =====*/
// Three dogs take turns greeting the visitor, each with its own line in the bubble. Every photo is composed the same way
// (the dog's head a quarter in from the left, the right half dark), so the headline and the bubble's tail fit them all.
// `position` is the crop: the dog's face on a phone's narrow band, the dog's half on desktop.
const SLIDES = [
  {
    name: "hero",
    alt: "یک ژرمن‌شپرد روی مبل چرمی دراز کشیده و مستقیم به دوربین نگاه می‌کند",
    line: "سلام! من اینجام که زندگی من و تو با هم بهتر بشه :)",
    position: "object-[24%_30%] lg:object-[20%_40%]",
  },
  {
    name: "hero-2",
    alt: "یک مالینویز با قلاده‌ی چرمی، شب کنار خیابان نشسته و به دوربین نگاه می‌کند",
    line: "توی خیابون هم حواسم فقط به توئه.",
    position: "object-[8%_50%] lg:object-[0%_4%]",
  },
  {
    name: "hero-3",
    alt: "یک توله گلدن رتریور کنار در خانه دراز کشیده و قلاده‌اش را به دهان گرفته",
    line: "قلاده‌مو آوردم! بریم تمرین؟",
    position: "object-[4%_50%] lg:object-[0%_35%]",
  },
];

/** `useSyncExternalStore` needs a subscription; whether we've hydrated never changes afterwards. */
const subscribeToNothing = () => () => {};

/*===== Home Hero =====*/
/**
 * The first screen: a dog looks straight at the visitor and says hello. The photo fills the band; the dog sits in its
 * left half (the end, in RTL) and the right half is already dark, so the headline goes there with no box behind it. On
 * phones the photo shows the dog's face on top and the words follow below on black.
 *
 * Three photos crossfade, and the bubble's line changes with the dog. The headline stays put and stays ivory: big gold
 * on the first screen read as a gold shop. The bubble drawing itself on load is the page's one orchestrated moment.
 */
export function HomeHero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // The progress bar drives the slideshow (it advances when the bar's animation ends). Rendered only after hydration:
  // an animation that ended before React attached its handler would leave the slideshow stuck on the first photo.
  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const next = () => setActive((index) => (index + 1) % SLIDES.length);

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-jet">
      {/*===== Photos =====*/}
      <div className="relative h-[58svh] max-h-[34rem] min-h-80 lg:absolute lg:inset-0 lg:h-auto lg:max-h-none">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.name}
            aria-hidden={index !== active}
            className={cn(
              "absolute inset-0 transition-opacity duration-1200 ease-in-out",
              index === active ? "opacity-100" : "opacity-0",
            )}
          >
            <picture>
              <source media="(min-width: 64rem)" srcSet={`/photo/home/${slide.name}-1536.webp`} />
              <img
                src={`/photo/home/${slide.name}-900.webp`}
                alt={slide.alt}
                width={1536}
                height={1024}
                // The first photo is the page's largest paint; the others are only needed seconds later.
                fetchPriority={index === 0 ? "high" : "low"}
                decoding={index === 0 ? undefined : "async"}
                // A slow push-in while the photo is up. It eases back out unseen, during the fade.
                className={cn(
                  "size-full object-cover transition-transform duration-[8s] ease-out",
                  slide.position,
                  index === active && "motion-safe:scale-[1.05]",
                )}
              />
            </picture>
          </div>
        ))}

        {/* Phones: the photo melts into the black the words sit on. Desktop: the dark half deepens toward the text, and
            the bottom edge settles into the strip below. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-jet to-transparent lg:hidden"
        />
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-linear-to-l from-jet from-25% via-jet/60 via-45% to-transparent to-65% lg:block"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 hidden h-32 bg-linear-to-t from-jet lg:block" />

        {/*------ Controls ------*/}
        {/* Above the words layer, which overlaps the photo's bottom on phones. Phones: the start corner, clear of the
            bubble at the end. Desktop: under the dog, at the container's end. */}
        <div className="absolute inset-x-0 bottom-24 z-10 lg:bottom-8">
          <fieldset className="site-container flex items-center gap-1 lg:justify-end">
            <legend className="sr-only">عکس‌های بالای صفحه</legend>
            {SLIDES.map((slide, index) => (
              <button
                key={slide.name}
                type="button"
                aria-label={`عکس ${formatNumberFa(index + 1)} از ${formatNumberFa(SLIDES.length)}`}
                aria-current={index === active}
                onClick={() => setActive(index)}
                className="group/dot grid h-8 w-9 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="relative block h-1 w-7 overflow-hidden rounded-full bg-chalk/30 transition-colors group-hover/dot:bg-chalk/50">
                  {index === active && (
                    <span
                      // A new key restarts the fill whenever the photo changes, by a click or on its own.
                      key={active}
                      onAnimationEnd={next}
                      className={cn(
                        // Fills from the right: the side Persian starts reading on.
                        "absolute inset-0 origin-right bg-primary",
                        hydrated && "motion-safe:animate-slide-progress",
                        // Important: the `animate-` shorthand would otherwise reset the play state to running.
                        paused && "[animation-play-state:paused]!",
                      )}
                    />
                  )}
                </span>
              </button>
            ))}
            {/* Reduced motion never advances on its own, so there's nothing to pause. */}
            <button
              type="button"
              aria-label={paused ? "ادامه‌ی عکس‌ها" : "توقف عکس‌ها"}
              onClick={() => setPaused((value) => !value)}
              className="grid size-8 place-items-center rounded-full text-chalk/70 outline-none hover:text-chalk focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hidden"
            >
              {paused ? <PlayIcon aria-hidden className="size-3.5" /> : <PauseIcon aria-hidden className="size-3.5" />}
            </button>
          </fieldset>
        </div>
      </div>

      {/*===== Words =====*/}
      <div className="relative site-container lg:flex lg:min-h-[min(46rem,calc(100svh-5rem))] lg:items-center">
        <div className="relative -mt-20 pb-section-sm lg:mt-0 lg:w-[46%] lg:py-section-md">
          {/*------ Bubble ------*/}
          {/* Above the headline, at its end, so the tail points back at the dog: up at its face on a phone, across
              at it on desktop. Every dog's line sits in the same grid cell, so the bubble keeps the size of the
              longest and doesn't jump when the line changes. */}
          <div className="flex justify-end">
            <SpeechBubble tail="top-end" lgTail="bottom-end" drawIn className="max-w-[17rem] lg:max-w-[19rem]">
              <span className="grid">
                {SLIDES.map((slide, index) => (
                  <span
                    key={slide.name}
                    aria-hidden={index !== active}
                    className={cn(
                      "transition-opacity duration-700 [grid-area:1/1]",
                      index === active ? "opacity-100 delay-500" : "opacity-0",
                    )}
                  >
                    {slide.line}
                  </span>
                ))}
              </span>
            </SpeechBubble>
          </div>

          {/*------ Headline ------*/}
          <h1 id="hero-title" className="mt-8 font-display text-display font-black text-balance lg:mt-10">
            من فقط فرمان نمی‌برم؛ می‌فهمم.
          </h1>
          <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">
            آموزش خصوصی با {HEAD_TRAINER.firstName}، توی خونه‌ی خودمون یا بیرون. اولین دیدارمون رایگانه.
          </p>

          {/*------ Actions ------*/}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/assessment" className={cn(buttonVariants({ size: "lg" }))}>
              ارزیابی رایگان بگیر
            </Link>
            <Link to="/#courses" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              دوره‌ها را ببین
            </Link>
          </div>

          <ChalkDoodle
            name="sparkles"
            className="absolute start-0 -top-2 w-10 -rotate-6 opacity-70 max-lg:hidden lg:top-[18%]"
          />
        </div>
      </div>
    </section>
  );
}
