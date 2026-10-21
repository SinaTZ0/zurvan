/*===== Page Motion =====*/
/**
 * The page's own motion, one `<style>` for the whole slice (the shared loops and answers live in app.css):
 *
 * - **Load moment:** the price-tag dog steps up out of the path in front of his stall (`by-rise`, the clip moving with
 *   him so nothing shows below the ground until he is up) and his bubble pops at 0.4s (`by-pop`); the picked dog's
 *   bubble answers from its print right after (`by-print-pop`).
 * - **Picking a dog:** the prints lift, straighten and tilt back by CSS transitions on their own classes; the bubbles and
 *   the h1 re-key and pop or rise (the shared `answer-*`); the lists arrive staggered (`answer-in`, `--answer-delay`).
 * - **Adding to the cart:** the chalk price tag swings once on its string (`by-swing`); the cart bar slides up and its
 *   count disc re-pops.
 * - **Scroll:** each plate's dog rises from behind its edge as it scrolls in (`by-edge-rise`), where the browser can tie
 *   it to the scroll; elsewhere he is simply there.
 *
 * Everything is off for reduced motion, which shows the finished page.
 */
export function PageMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .by-rise { animation: by-rise .8s cubic-bezier(.25,.8,.35,1) .05s both; }
        .by-pop {
          transform-origin: var(--pop-origin, calc(100% - 1.75rem) 100%);
          animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .4s both, lively-float 3.4s ease-in-out .8s infinite alternate;
        }
        .by-print-pop {
          transform-origin: calc(100% - 1.75rem) 100%;
          animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .75s both;
        }
        .by-swing { transform-origin: calc(100% - 1.4rem) 50%; animation: by-swing 1.1s cubic-bezier(.3,.6,.4,1) both; }
        @supports (animation-timeline: view()) {
          .by-edge-rise {
            animation: by-rise linear both;
            animation-timeline: view();
            animation-range: entry 35% cover 40%;
          }
        }
      }
      /* The clip's bottom stays on the edge (97% of his box, which is sunk 3%) while he moves up through it. */
      @keyframes by-rise {
        0% { transform: translateY(100%); clip-path: inset(-40% -40% 103% -40%); }
        80% { transform: translateY(-3%); clip-path: inset(-40% -40% 0% -40%); }
        90% { transform: none; clip-path: inset(-40% -40% 3% -40%); }
        100% { transform: none; clip-path: inset(-40% -40% -10% -40%); }
      }
      /* The tag's resting tilt is its own class (-2.5deg), which this rotation composes with. */
      @keyframes by-swing {
        0% { transform: rotate(0); }
        18% { transform: rotate(9deg); }
        40% { transform: rotate(-6deg); }
        60% { transform: rotate(3.5deg); }
        80% { transform: rotate(-1.5deg); }
        100% { transform: rotate(0); }
      }
    `}</style>
  );
}
