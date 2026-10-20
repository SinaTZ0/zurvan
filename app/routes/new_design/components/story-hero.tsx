import { cn } from "cn";
import { useEffect, useState } from "react";

import { HEAD_TRAINER } from "~/lib/head-trainer";
import { Bubble, Cut, EvaluationButton, HEADING } from "~/routes/new_design/components/story-parts";
import { BRICK, GRAIN } from "~/routes/new_design/components/story-theme";

/*===== Typed Word =====*/
// The headline types what the dog learns with the trainer, one skill at a time, each in its own colour. First person
// singular on purpose: «یاد بگیریم بشینیم» put the owner on the floor too. The colours are set by hand rather than
// taken from the palette: the palette's gold is the only accent, and the point is a change.
const TYPED_WORDS = [
  { text: "بشینم", color: "#FFC21A" },
  { text: "بمونم", color: "#FFF4DC" },
  { text: "صدام کنی، بیام", color: "#FFD98A" },
  { text: "آروم باشم", color: "#B9DDB0" },
  { text: "کنار پات راه برم", color: "#FFC21A" },
] as const;

// Milliseconds per letter typed and erased, how long a whole word stays, and the beat before the next one starts.
const TYPE_MS = 110;
const ERASE_MS = 50;
const HOLD_MS = 1800;
const GAP_MS = 350;

/**
 * Types and erases `TYPED_WORDS` in turn, with a caret in the word's colour. The first word is rendered whole, so the
 * server's HTML and reduced motion both show a finished sentence; the loop starts by erasing it. Screen readers get
 * the whole list once (the h1 carries it), so the typed letters are hidden from them.
 */
function TypedWord() {
  const [{ word, chars, erasing }, setState] = useState({
    word: 0,
    chars: TYPED_WORDS[0].text.length,
    erasing: false,
  });
  const text = TYPED_WORDS[word].text;

  /*------ One step per timeout ------*/
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const full = chars === text.length;
    const delay = erasing ? (chars === 0 ? GAP_MS : ERASE_MS) : full ? HOLD_MS : TYPE_MS;
    const timer = window.setTimeout(() => {
      if (!erasing) setState({ word, chars: full ? chars : chars + 1, erasing: full });
      else if (chars > 0) setState({ word, chars: chars - 1, erasing });
      else setState({ word: (word + 1) % TYPED_WORDS.length, chars: 0, erasing: false });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [word, chars, erasing, text]);

  const color = TYPED_WORDS[word].color;
  // The caret holds still while letters move and blinks only while a whole word rests or the line is empty.
  const resting = (!erasing && chars === text.length) || chars === 0;

  return (
    <span aria-hidden className="whitespace-nowrap" style={{ color }}>
      {text.slice(0, chars)}
      <span
        className={`ms-1 inline-block h-[0.9em] w-[0.08em] translate-y-[0.12em] rounded-full bg-current ${resting ? "st-caret" : ""}`}
      />
    </span>
  );
}

/*===== Trainer's Name =====*/
/**
 * The trainer's name in the headline with a gold chalk underline. «طلا» means "gold", so the name gets the gold as a
 * stroke under it rather than in the letters: the typed word below is already the headline's gold, and a gold name
 * on top of it would make the first screen a bullion shop. The stroke draws right to left (the reading direction) as
 * the end of the hero's one load moment, just after the bubble has popped; with reduced motion it's simply there.
 */
function TrainerName() {
  return (
    <span className="relative inline-block">
      {HEAD_TRAINER.firstName}
      <svg
        aria-hidden
        viewBox="0 0 120 14"
        fill="none"
        className="absolute top-[calc(100%-0.16em)] -right-[0.06em] w-[calc(100%+0.12em)] overflow-visible"
      >
        <filter id="st-hero-chalk" x="-5%" y="-40%" width="110%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} />
          <feDisplacementMap in="SourceGraphic" scale={1.6} />
        </filter>
        {/* One quick stroke under the word and a shorter hook back, the way a hand underlines a name. */}
        <path
          d="M118 4.5C88 8 52 9 3 6.5C30 10.5 62 12 92 11"
          pathLength={1}
          stroke="var(--st-red)"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#st-hero-chalk)"
          className="st-underline"
        />
      </svg>
    </span>
  );
}

/*===== Hero =====*/
// "The mascot lives in the layout": the paws image is cut flat at the chest, 87% down, which is exactly where the sage
// card's top edge sits. The card is behind the image (z-0 vs z-10), so the paws drape over its border while the body
// seems to stand behind it. Card geometry hangs off the image box (`top-[87%]`), so it holds at every size.
//
// From lg up the hero is exactly one laptop screen, from a 1280×720 to a 2560×1600 at 150%:
// the section takes the screen less the header (4.75rem) and the 2.25rem of ground showing under it, the grid
// stretches so the card lands on its bottom, and the dog and headline are sized by the screen's height. The dog's
// height is the screen less 13.5rem (header, ground, the card's 5rem below him and a little air), times 285/463 for
// his width. He stops at 23rem, ~1.3x the cut-out's natural width, so a tall screen gets air rather than a soft dog:
// the dog and copy are centred in the height, and the card runs down to the section's bottom (clipped there, under
// the ground), so the spare height is shared between the air above him and the card below.
export function StoryHero() {
  return (
    <section
      aria-labelledby="st-hero-title"
      className="relative overflow-x-clip lg:flex lg:min-h-[calc(100svh-7rem)] lg:flex-col lg:overflow-clip"
    >
      {/* The one load moment: he rises from behind the card edge, then the bubble pops. Off for reduced motion. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .st-rise { animation: st-rise .9s cubic-bezier(.2,.8,.25,1) both; }
          .st-pop { animation: st-pop .45s cubic-bezier(.3,1.5,.5,1) .75s both; transform-origin: 85% 100%; }
        }
        @keyframes st-rise {
          from { transform: translateY(34%); clip-path: inset(-200px -200px 13% -200px); }
          to { transform: none; clip-path: inset(-200px -200px 0 -200px); }
        }
        @keyframes st-pop { from { transform: scale(.4); opacity: 0; } to { transform: none; opacity: 1; } }
        /* Starts as the bubble lands (.75s + .45s). */
        @media (prefers-reduced-motion: no-preference) {
          .st-underline { stroke-dasharray: 1; animation: st-underline .6s cubic-bezier(.5,0,.3,1) 1.2s both; }
        }
        @keyframes st-underline { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: no-preference) { .st-caret { animation: st-caret 1s steps(1) infinite; } }
        @keyframes st-caret { 50% { opacity: 0; } }
      `}</style>

      {/* Foliage in the copy's bottom corner, as in the mockup; the card covers that corner on narrow screens. */}
      <div aria-hidden className="absolute -right-6 bottom-0 hidden w-40 lg:block xl:w-48">
        <Cut name="plants" eager className="st-sway w-full" />
      </div>

      <div className="mx-auto grid max-w-6xl items-end gap-x-6 px-4 md:px-8 lg:w-full lg:flex-1 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        {/*------ Copy ------*/}
        {/* Centred until the copy has a column of its own on lg; hung on the right edge, it left the screen's left half
            empty. */}
        <div className="pt-7 pb-8 text-center sm:pt-10 lg:pt-[clamp(1rem,4svh,4rem)] lg:pb-[clamp(3.5rem,11svh,6rem)] lg:text-start">
          {/* On lg, the headline follows the height too (with a rem part, so browser zoom still enlarges it), and
              the width on a narrow lg screen, where its column is tight. */}
          <h1
            id="st-hero-title"
            className={cn(
              HEADING,
              "text-[2.6rem] sm:text-6xl lg:text-[clamp(2.75rem,calc(0.5rem+min(7.5svh,5.2vw)),4.5rem)]",
              // After the sizes: `cn` lets a later font size drop an earlier `leading-*`. Taller than HEADING's 1.2,
              // so the underline under «طلا» clears the «گ» on the line below.
              "leading-[1.4]",
            )}
          >
            {/* No «سلام» here: the bubble beside him already says it. */}
            پیش <TrainerName />
            <br />
            یاد می‌گیرم
            {/* The typed word gets its own line, so the line's length changes and nothing else moves. */}
            <br />
            <span className="sr-only">: بشینم، بمونم، صدام کنی بیام، آروم باشم و کنار پات راه برم</span>
            <TypedWord />
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-lg leading-8 text-(--st-ink)/80 lg:mx-0">
            آموزش خصوصی سگ در تهران،
            <br />
            در محل خودتون یا توی مرکز.
          </p>
          <EvaluationButton className="mt-7" />
        </div>

        {/*------ Mascot on the card edge ------*/}
        {/* Below lg the dog and his bubble are centred as one group: the bubble overhangs his left side by about
            6.5rem (7rem from sm), so he moves right by half that. */}
        <div className="relative mx-auto mb-20 w-[13.5rem] translate-x-[3.25rem] sm:w-72 sm:translate-x-14 lg:mr-0 lg:ml-auto lg:w-[clamp(15rem,calc((100svh-13.5rem)*0.615),23rem)] lg:translate-x-0">
          {/* The card is a brick wall he looks over, with the page's grain on the bricks. */}
          <div
            aria-hidden
            style={{ backgroundImage: `${GRAIN}, ${BRICK}` }}
            className="absolute top-[87%] -right-[45%] -bottom-20 -left-[100vw] z-0 rounded-tr-[3rem] border-t-2 border-(--st-line)/70 bg-(--st-sage) lg:-bottom-[100svh]"
          />
          {/* On lg, the bushes are a share of the dog's width (their lg sizes at his 21rem), so they shrink with him. */}
          <Cut
            name="plants"
            eager
            className="st-sway absolute right-[78%] bottom-[10%] z-[5] w-40 sm:w-48 lg:w-[67%]"
          />
          <Cut
            name="plants"
            eager
            className="st-sway-2 absolute bottom-[8%] left-[78%] z-[5] w-28 -scale-x-100 sm:w-40 lg:w-[52%]"
          />
          {/* The wrapper wiggles while the image rises, so the two animations don't fight over one transform. */}
          <div className="st-wiggle st-pet relative z-10">
            <Cut name="paws" eager className="st-rise block w-full" />
          </div>
          <Bubble tail="right" className="st-pop absolute top-[2%] right-[78%] z-20 w-[9.5rem] sm:w-44 lg:w-52">
            سلام، من زروانم! بیا تو، در بازه.
          </Bubble>
        </div>
      </div>
    </section>
  );
}
