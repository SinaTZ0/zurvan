/*===== Page Motion =====*/
/**
 * The page's own motion, one `<style>` for the whole slice (the shared loops and answers live in app.css):
 *
 * - **Load moment:** the phone dog lifts the receiver (`pl-lift`, a small rise and tilt of his whole picture), his bubble
 *   pops at 0.4s (`pl-pop`), the tally's counts rise one after another (`pl-rise-*`); the rows arrive staggered
 *   (`pl-row`) and each road draws itself: its first disc pops, every line grows in reading direction (`pl-line`) and
 *   the disc it reaches pops after it (`pl-disc`).
 * - **Answers:** a pill or a page brings its list in the same way (the list is re-keyed); an added row arrives alone with
 *   the fading gold ring; the writing dog pops his bubble from its tail (`pl-say`, keyed per line) and fades it out when
 *   the partner leaves the form (`pl-quiet`); «چطور حساب می‌شه؟» opens and closes as one motion (`pl-fold`, its lines
 *   lifting in after the row has grown); the empty list's dog speaks after his stage rises (`pl-empty-pop`).
 * - **Scroll:** each plate's dog rises from behind its edge (`pl-edge`) and the list dog's bubble pops as he comes up
 *   (`pl-view-pop`), scroll-driven where the browser can, elsewhere simply there.
 *
 * Everything is off for reduced motion, which shows the finished page: a quiet bubble is simply gone and the note opens
 * without the fold.
 */
export function PageMotion() {
  return (
    <style>{`
      .pl-quiet { opacity: 0; visibility: hidden; }
      .pl-fold { display: grid; grid-template-rows: 1fr; }
      .pl-fold[data-open="false"] { grid-template-rows: 0fr; visibility: hidden; }
      @media (prefers-reduced-motion: no-preference) {
        .pl-lift { transform-origin: 40% 100%; animation: pl-lift 1.1s cubic-bezier(.3,.7,.4,1) .1s both; }
        .pl-pop {
          transform-origin: calc(100% - 2.25rem) 100%;
          animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .4s both, lively-float 3.4s ease-in-out .8s infinite alternate;
        }
        .pl-rise { animation: answer-in .45s cubic-bezier(.2,.8,.2,1) both; }
        .pl-rise-1 { animation-delay: .5s; }
        .pl-rise-2 { animation-delay: .6s; }
        .pl-rise-3 { animation-delay: .7s; }

        .pl-row { animation: pl-row .5s cubic-bezier(.2,.8,.2,1) calc(var(--answer-delay, 0s) + .1s) both; }
        .pl-disc {
          animation: pl-disc .34s cubic-bezier(.3,1.5,.5,1) calc(var(--road-delay, 0s) + .3s + var(--disc-step, 0) * .34s) both;
        }
        .pl-line {
          transform-origin: right;
          animation: pl-line .3s cubic-bezier(.4,0,.6,1) calc(var(--road-delay, 0s) + .42s + var(--disc-step, 0) * .34s) both;
        }
        [dir="ltr"] .pl-line { transform-origin: left; }

        .pl-say {
          transform-origin: 2.25rem 100%;
          animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) both, lively-float 3.4s ease-in-out .5s infinite alternate;
        }
        .pl-quiet { transform-origin: 2.25rem 100%; animation: pl-hush .26s ease-in both; }
        /* English: the writing dog's bubble opens to the left, its tail on the right. */
        [dir="ltr"] :is(.pl-say, .pl-quiet) { transform-origin: calc(100% - 2.25rem) 100%; }
        .pl-empty-pop {
          transform-origin: calc(100% - 2.25rem) 100%;
          animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .8s both, lively-float 3.4s ease-in-out 1.2s infinite alternate;
        }

        .pl-fold { transition: grid-template-rows .4s cubic-bezier(.2,.8,.2,1), visibility 0s; }
        .pl-fold[data-open="false"] { transition: grid-template-rows .35s cubic-bezier(.2,.8,.2,1), visibility 0s linear .35s; }
        .pl-fold-line { transition: opacity .3s ease calc(.12s + var(--line-delay, 0s)), translate .3s ease calc(.12s + var(--line-delay, 0s)); }
        .pl-fold[data-open="false"] .pl-fold-line { opacity: 0; translate: 0 -.4rem; transition-delay: 0s; }

        @supports (animation-timeline: view()) {
          .pl-edge {
            animation: pl-edge linear both;
            animation-timeline: view();
            /* Done once he is fully in view, so a dog on the first screen is never left half risen. */
            animation-range: entry 10% entry 100%;
          }
          .pl-view-pop {
            transform-origin: var(--pop-origin, 50% 100%);
            animation: answer-pop linear both;
            animation-timeline: view();
            animation-range: entry 50% entry 100%;
          }
        }
      }
      @keyframes pl-lift {
        0%, 100% { transform: none; }
        30% { transform: translateY(-4%) rotate(-3deg); }
        55% { transform: translateY(1%) rotate(1.5deg); }
        75% { transform: translateY(-1%) rotate(-.5deg); }
      }
      @keyframes pl-row {
        from { opacity: 0; transform: translateY(1rem); }
        to { opacity: 1; transform: none; }
      }
      @keyframes pl-disc {
        from { opacity: 0; transform: scale(.3); }
        to { opacity: 1; transform: none; }
      }
      @keyframes pl-line {
        from { transform: scaleX(0); }
        to { transform: none; }
      }
      @keyframes pl-hush {
        from { opacity: 1; visibility: visible; transform: none; }
        to { opacity: 0; visibility: hidden; transform: scale(.85); }
      }
      /* The clip's bottom stays on the edge (97% of his box, which is sunk 3%) while he moves up through it. */
      @keyframes pl-edge {
        0% { transform: translateY(100%); clip-path: inset(-40% -40% 103% -40%); }
        80% { transform: translateY(-3%); clip-path: inset(-40% -40% 0% -40%); }
        90% { transform: none; clip-path: inset(-40% -40% 3% -40%); }
        100% { transform: none; clip-path: inset(-40% -40% -10% -40%); }
      }
    `}</style>
  );
}
