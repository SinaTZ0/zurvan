import { cn } from "cn";
import { PawPrintIcon, PlusIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { formatNumber } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";
import { COLUMN } from "~/routes/account_home/column";

/*===== Types =====*/
export type Tally = { dogs: number; training: number; passed: number };

/*===== Home Hero =====*/
/**
 * The top of «سگ‌های من»: the center's dog welcomes the customer home in front of the board where his friends' pictures
 * are pinned. The words at the start: a greeting, the h1, one line and, with at least one dog, a tally plate of three
 * gold numbers. The stage at the end (on phones a band on top, so the greeting and the first dog stay close): the
 * dimmed cork board with the bowls at its foot, the bow dog in front of it a little towards the words, a bush either
 * side, a path, a night sky and a pool of warm light.
 *
 * The stage's pieces are placed with physical sides: they are tied to the pictures (every dog faces right, towards the
 * words), and the bubble's tail (a physical side, 2.25rem in from the bubble's right edge) is aimed at his head.
 *
 * The page's one load moment (`ah-*` below): the dog dips once into his bow, his bubble pops at 0.4s, the tally's
 * numbers rise in one after another. Off for reduced motion, which shows the finished hero.
 */
export function HomeHero({ firstName, tally }: { firstName: string; tally: Tally | null }) {
  return (
    <section aria-labelledby="account-home-title" className="pt-4 pb-10 lg:pt-section-sm lg:pb-14">
      <div className={`${COLUMN} grid gap-y-6 lg:grid-cols-12 lg:gap-x-12`}>
        {/*===== Words =====*/}
        <div className="order-2 lg:order-1 lg:col-span-7 lg:flex lg:flex-col lg:justify-center lg:py-6">
          {firstName && (
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/45 px-3.5 py-1 text-sm font-bold text-primary">
              <PawPrintIcon aria-hidden strokeWidth={2} className="size-4" />
              {m.account_home_hero_greeting({ firstName })}
            </p>
          )}
          <h1 id="account-home-title" className={cn(DISPLAY_HEADING, "mt-4 text-h1 text-balance")}>
            {m.account_home_hero_title()}
          </h1>
          <p className="mt-3 max-w-lg text-lead text-pretty text-muted-foreground">
            {tally ? m.account_home_hero_lead() : m.account_home_hero_lead_empty()}
          </p>

          {/*------ Tally and the Way to a New Dog ------*/}
          {/* Without dogs the panel below has the gold «معرفی سگ»: one way in, not two. */}
          {tally && (
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-5">
              <TallyPlate tally={tally} />
              <Link to="/account/dogs/new" className={buttonVariants({ variant: "outline", size: "lg" })}>
                <PlusIcon aria-hidden />
                {m.account_home_hero_new_dog()}
              </Link>
            </div>
          )}
        </div>

        {/*===== Stage =====*/}
        <HeroStage firstName={firstName} short={tally === null} />
      </div>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .ah-bow {
            transform-origin: 70% 100%;
            animation: ah-bow .9s cubic-bezier(.3,.7,.4,1) .05s both;
          }
          .ah-pop {
            transform-origin: calc(100% - 2.25rem) 100%;
            animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .4s both, lively-float 3.4s ease-in-out .8s infinite alternate;
          }
          .ah-rise { animation: answer-in .45s cubic-bezier(.2,.8,.2,1) both; }
          .ah-rise-1 { animation-delay: .55s; }
          .ah-rise-2 { animation-delay: .65s; }
          .ah-rise-3 { animation-delay: .75s; }
          .ah-first-pop {
            transform-origin: calc(100% - 2.25rem) 0;
            animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .9s both;
          }
        }
        @keyframes ah-bow {
          0%, 100% { transform: none; }
          30% { transform: translateY(5%) rotate(2.5deg) scale(1.02, .94); }
          55% { transform: translateY(-2%) rotate(-1deg) scale(.99, 1.03); }
          75% { transform: translateY(1%); }
        }
      `}</style>
    </section>
  );
}

/*===== Tally Plate =====*/
/**
 * Three gold numbers on a grained plate: the dogs, the courses in training now, the courses passed. A `dl`, the number
 * shown over its label. Hairlines are each cell's start border, the first one's pulled out of the clip.
 */
function TallyPlate({ tally }: { tally: Tally }) {
  const cells = [
    {
      key: "dogs",
      label: tally.dogs === 1 ? m.account_home_hero_dogs_one() : m.account_home_hero_dogs_other(),
      value: tally.dogs,
    },
    {
      key: "training",
      label: tally.training === 1 ? m.account_home_hero_training_one() : m.account_home_hero_training_other(),
      value: tally.training,
    },
    {
      key: "passed",
      label: tally.passed === 1 ? m.account_home_hero_passed_one() : m.account_home_hero_passed_other(),
      value: tally.passed,
    },
  ];

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-border bg-card paper-grain shadow-sm sm:w-auto">
      <dl className="-ms-px grid grid-cols-3">
        {cells.map(({ key, label, value }, index) => (
          <div
            key={key}
            className="flex flex-col-reverse items-center gap-1 border-s border-border px-3 py-4 sm:px-6"
          >
            <dt className="text-center text-xs leading-snug font-bold text-balance text-muted-foreground sm:text-sm">
              {label}
            </dt>
            <dd className={`ah-rise ah-rise-${index + 1} font-display text-4xl leading-none font-black text-primary`}>
              {formatNumber(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/*===== Hero Stage =====*/
/**
 * The picture: a fixed box of pieces standing on the path at the stage's bottom, so a taller words column only adds
 * sky. `--dog-h` is the dog's height and `--ground` how high the path lifts the pieces, so the bubble sits just over his
 * back whatever the screen. Phones: a 13rem band; from `lg`, as tall as the words. `short` is an account with no dog.
 */
function HeroStage({ firstName, short }: { firstName: string; short: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative order-1 h-[13rem] [--dog-h:8.5rem] [--ground:0.9rem] lg:order-2 lg:col-span-5 lg:h-auto lg:[--dog-h:15.2rem] lg:[--ground:1.2rem]",
        // Without dogs the words are three lines: the stage keeps just the room the dog and his bubble need.
        short ? "lg:min-h-[21rem]" : "lg:min-h-[25rem]",
      )}
    >
      {/* A pool of warm light where he stands. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_48%_55%_at_55%_78%,rgb(255_194_26/0.08),transparent)]" />

      {/*------ Sky ------*/}
      <NightSky className="inset-x-[6%] top-1 h-20 lg:top-4 lg:h-28" />

      {/*------ Path ------*/}
      <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />

      {/*------ Pieces ------*/}
      {/* The board at the far (left) end, the bowls at its foot, the dog in front a little towards the words. */}
      <div className="absolute inset-x-0 bottom-(--ground) mx-auto h-full w-[20rem] lg:w-[28rem]">
        <MascotCut
          name="plants"
          eager
          className="lively-sway absolute bottom-0 -left-[1.5rem] w-[3.75rem] translate-y-[6%] lg:-left-[2rem] lg:w-[5.5rem]"
        />
        <MascotCut
          name="photo-board"
          eager
          className="absolute bottom-0 left-[0.5rem] w-[9rem] translate-y-[5%] lg:w-[16rem]"
        />
        <MascotCut
          name="bowls"
          eager
          className="absolute bottom-0 left-[1.25rem] w-[5rem] translate-y-[8%] lg:left-[2rem] lg:w-[8.5rem]"
        />
        <MascotCut
          name="plants"
          eager
          className="lively-sway-2 absolute -right-[1.25rem] bottom-0 w-[3.25rem] translate-y-[6%] -scale-x-100 lg:-right-[1.75rem] lg:w-[4.75rem]"
        />

        {/*------ The Dog ------*/}
        {/* The dip is on the wrapper, the idle breath on the picture, so one doesn't cancel the other. */}
        <div className="ah-bow absolute right-[1.5rem] bottom-0 h-(--dog-h) translate-y-[3%]">
          <div className="lively-pet h-full">
            <MascotCut name="bow" eager className="lively-breathe block h-full w-auto" />
          </div>
        </div>

        {/*------ Bubble ------*/}
        {/* His head is 18% of his width in from his right side (a 9.5rem / 17rem wide dog), so the tail's centre lands
            over it: right edge = 1.5rem + 18% of the dog − 2.25rem. Over his back, clear of the raised tail. */}
        <ChalkBubble
          tail="right"
          className="ah-pop absolute right-[0.95rem] bottom-[calc(var(--dog-h)+0.5rem)] max-w-[13rem] text-pretty lg:right-[2.3rem] lg:max-w-[16rem]"
        >
          {firstName ? m.account_home_hero_bubble_named({ firstName }) : m.account_home_hero_bubble()}
        </ChalkBubble>
      </div>
    </div>
  );
}
