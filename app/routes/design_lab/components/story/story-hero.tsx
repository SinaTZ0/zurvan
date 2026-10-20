import { useEffect, useState } from "react";

import { Bubble, Cut, EvaluationButton, HEADING } from "~/routes/design_lab/components/story/story-parts";

/*===== Typed Word =====*/
// Design 7's headline types what you learn together, one skill at a time, each in its own colour. The colours are
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
export function StoryHero({ typed = false }: { typed?: boolean }) {
  return (
    <section aria-labelledby="st-hero-title" className="relative overflow-x-clip">
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
        <Cut name="plants" eager className="w-full" />
      </div>

      <div className="mx-auto grid max-w-6xl items-end gap-x-6 px-4 md:px-8 lg:grid-cols-[1.05fr_1fr]">
        {/*------ Copy ------*/}
        <div className="pt-10 pb-8 lg:pt-16 lg:pb-24">
          <h1 id="st-hero-title" className={`${HEADING} text-[2.6rem] sm:text-6xl lg:text-[4.5rem]`}>
            سلام! بیا با هم
            <br />
            یاد بگیریم
            {/* The typed word gets its own line, so the line's length changes and nothing else moves. */}
            {typed && (
              <>
                <br />
                <span className="sr-only">: بشینیم، بمونیم، بیایم، آروم باشیم و کنار پا راه بریم</span>
                <TypedWord />
              </>
            )}
          </h1>
          <p className="mt-5 max-w-sm text-lg leading-8 text-(--st-ink)/80">
            آموزش خصوصی، با حوصله و دقت،
            <br />
            برای زندگی شادتر تو و سگت.
          </p>
          <EvaluationButton className="mt-7" />
        </div>

        {/*------ Mascot on the card edge ------*/}
        <div className="relative mb-20 ml-auto w-[13.5rem] sm:w-72 lg:w-[21rem]">
          <div
            aria-hidden
            className="absolute top-[87%] -right-[45%] -bottom-20 -left-[100vw] z-0 rounded-tr-[3rem] border-t-2 border-(--st-line)/70 bg-(--st-sage)"
          />
          <Cut name="plants" eager className="absolute right-[78%] bottom-[10%] z-[5] w-40 sm:w-48 lg:w-56" />
          <Cut
            name="plants"
            eager
            className="absolute bottom-[8%] left-[78%] z-[5] w-28 -scale-x-100 sm:w-40 lg:w-44"
          />
          <Cut name="paws" eager className="st-rise relative z-10 w-full" />
          <Bubble tail="right" className="st-pop absolute top-[2%] right-[78%] z-20 w-[7.2rem] sm:w-44 lg:w-52">
            سلام، من فندقم! جای خوبی اومدی.
          </Bubble>
        </div>
      </div>
    </section>
  );
}
