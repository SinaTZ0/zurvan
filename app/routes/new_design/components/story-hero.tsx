import { cn } from "cn";
import { useEffect, useState } from "react";

import { Bubble, Cut, EvaluationButton, HEADING } from "~/routes/new_design/components/story-parts";

/*===== Typed Word =====*/
// The headline types what you learn together, one skill at a time, each in its own colour. The colours are
// set by hand rather than taken from the palette: the palette's gold is the only accent, and the point is a change.
const TYPED_WORDS = [
  { text: "بشینیم", color: "#FFC21A" },
  { text: "بمونیم", color: "#FFF4DC" },
  { text: "بیایم", color: "#FFD98A" },
  { text: "آروم باشیم", color: "#B9DDB0" },
  { text: "کنار پا راه بریم", color: "#FFC21A" },
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
        @media (prefers-reduced-motion: no-preference) { .st-caret { animation: st-caret 1s steps(1) infinite; } }
        @keyframes st-caret { 50% { opacity: 0; } }
      `}</style>

      {/* Foliage in the copy's bottom corner, as in the mockup; the card covers that corner on narrow screens. */}
      <div aria-hidden className="absolute -right-6 bottom-0 hidden w-40 lg:block xl:w-48">
        <Cut name="plants" eager className="st-sway w-full" />
      </div>

      <div className="mx-auto grid max-w-6xl items-end gap-x-6 px-4 md:px-8 lg:w-full lg:flex-1 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        {/*------ Copy ------*/}
        <div className="pt-7 pb-8 sm:pt-10 lg:pt-[clamp(1rem,4svh,4rem)] lg:pb-[clamp(3.5rem,11svh,6rem)]">
          {/* On lg, the headline follows the height too (with a rem part, so browser zoom still enlarges it), and
              the width on a narrow lg screen, where its column is tight. */}
          <h1
            id="st-hero-title"
            className={cn(
              HEADING,
              "text-[2.6rem] sm:text-6xl lg:text-[clamp(2.75rem,calc(0.5rem+min(7.5svh,5.2vw)),4.5rem)]",
            )}
          >
            سلام! بیا با هم
            <br />
            یاد بگیریم
            {/* The typed word gets its own line, so the line's length changes and nothing else moves. */}
            <br />
            <span className="sr-only">: بشینیم، بمونیم، بیایم، آروم باشیم و کنار پا راه بریم</span>
            <TypedWord />
          </h1>
          <p className="mt-5 max-w-sm text-lg leading-8 text-(--st-ink)/80">
            آموزش خصوصی، با حوصله و دقت،
            <br />
            برای زندگی شادتر تو و سگت.
          </p>
          <EvaluationButton className="mt-7" />
        </div>

        {/*------ Mascot on the card edge ------*/}
        <div className="relative mb-20 ml-auto w-[13.5rem] sm:w-72 lg:w-[clamp(15rem,calc((100svh-13.5rem)*0.615),23rem)]">
          <div
            aria-hidden
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
            سلام، من فندقم! جای خوبی اومدی.
          </Bubble>
        </div>
      </div>
    </section>
  );
}
