import { cn } from "cn";
import { useEffect, useState } from "react";
import { useNavigationType } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { HERO_COOKIE, HERO_COOKIE_MAX_AGE, nextHeroIndex } from "~/lib/hero-state";
import { ChalkDoodle } from "~/components/chalk-doodle";
import { SpeechBubble } from "~/components/speech-bubble";
import { HERO_SLIDES } from "~/routes/home/hero-slides";

/*===== Home Hero =====*/
/**
 * The first screen: a dog looks straight at the visitor and says hello. The photo fills the band; the dog sits in its
 * left half (the end, in RTL) and the right half is already dark, so the headline goes there with no box behind it. On
 * phones the photo shows the dog's face on top and the words follow below on black.
 *
 * Which of the three dogs shows follows the visitor, not a clock (rules in `~/lib/hero-state`): a new session or an
 * arrival by a link steps to the next dog; back, forward and reload keep the one that was showing; waiting changes
 * nothing. The dots below still let a visitor pick one by hand. The headline stays put and stays ivory: big gold on the
 * first screen read as a gold shop. The bubble drawing itself on load is the page's one orchestrated moment.
 *
 * `initialIndex` is the dog the server chose (it is also the one painted first). `startedSession` says the server already
 * stepped for a new session, so a client-side arrival in that same request must not step a second time.
 */
export function HomeHero({ initialIndex, startedSession }: { initialIndex: number; startedSession: boolean }) {
  // A full load and back/forward arrive as `POP`: show the dog the server chose. A link or button arrives as `PUSH` or
  // `REPLACE`: step to the next dog. Decided in the initial state, so nothing flashes and server and client agree.
  const navigationType = useNavigationType();
  const [active, setActive] = useState(() =>
    navigationType === "POP" || startedSession
      ? initialIndex
      : nextHeroIndex({ current: initialIndex, count: HERO_SLIDES.length }),
  );

  // Remember the dog on screen, so a reload or Back keeps it and the next session starts from it.
  useEffect(() => {
    document.cookie = `${HERO_COOKIE}=${active}; path=/; max-age=${HERO_COOKIE_MAX_AGE}; samesite=lax`;
  }, [active]);

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-jet">
      {/*===== Photos =====*/}
      <div className="relative h-[58svh] max-h-[34rem] min-h-80 lg:absolute lg:inset-0 lg:h-auto lg:max-h-none">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.name}
            aria-hidden={index !== active}
            className={cn(
              "absolute inset-0 transition-opacity duration-1200 ease-in-out motion-reduce:transition-none",
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
                // The dog showing first is the page's largest paint; the others are only needed if the visitor picks one.
                fetchPriority={index === active ? "high" : "low"}
                decoding={index === active ? undefined : "async"}
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
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.name}
                type="button"
                aria-label={`عکس ${formatNumberFa(index + 1)} از ${formatNumberFa(HERO_SLIDES.length)}`}
                aria-current={index === active}
                onClick={() => setActive(index)}
                className="group/dot grid h-8 w-9 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span
                  className={cn(
                    "block h-1 w-7 rounded-full transition-colors",
                    index === active ? "bg-primary" : "bg-chalk/30 group-hover/dot:bg-chalk/50",
                  )}
                />
              </button>
            ))}
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
                {HERO_SLIDES.map((slide, index) => (
                  <span
                    key={slide.name}
                    aria-hidden={index !== active}
                    className={cn(
                      "transition-opacity duration-700 [grid-area:1/1] motion-reduce:transition-none",
                      index === active ? "opacity-100 delay-500 motion-reduce:delay-0" : "opacity-0",
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
            <Link to="/courses" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
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
