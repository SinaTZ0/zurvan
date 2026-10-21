/*===== Page Motion =====*/
/**
 * The Cart's own motion, one `<style>` for the whole slice (the shared loops and answers live in app.css):
 *
 * - **Load moment** (one per page): without a payment banner the hero's dog rolls his cart in a few rem along the strip
 *   and stops (`ct-roll`), his bubble pops after him. With a banner, the banner's: on `paid` the `jump` dog leaps up
 *   from the strip and lands (`ct-leap`), his bubble and chalk ticks pop as he lands, the road of what happens next
 *   draws itself in reading direction (`ct-draw`); on `failed` the sorry dog rises from behind the strip (`ct-up`).
 * - **Arrival:** the bags rise in one after another (the shared `answer-in` with `--answer-delay`), each print drops
 *   and settles on its tape (`ct-drop`).
 * - **Scroll:** each plate's dog rises from behind its top edge (`ct-edge-rise`), tied to the scroll where the browser
 *   can; elsewhere he is simply there.
 * - **Answers:** a removed row or bag folds away (`ct-fold`: its grid row closes as it fades); the total re-counts (the
 *   old number dims while the review refreshes, the new one rises in, keyed); bubbles re-pop when their words change;
 *   the counter's dog crossfades to the card dog while paying (a transition in the component).
 *
 * Everything is off for reduced motion, which shows the finished page.
 */
export function PageMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .ct-roll { animation: ct-roll 1.1s cubic-bezier(.22,.8,.3,1) .1s both; }
        .ct-roll-wheels { animation: ct-bob .28s ease-in-out .1s 4 alternate; }
        .ct-drop { transform-origin: 50% 0; animation: ct-drop 1s cubic-bezier(.3,1.2,.5,1) var(--ct-delay, .05s) both; }
        .ct-up { animation: ct-up .75s cubic-bezier(.25,.8,.35,1) .1s both; }
        .ct-leap { transform-origin: 50% 100%; animation: ct-leap 1.15s cubic-bezier(.3,.6,.35,1) .1s both; }
        .ct-fold { animation: ct-fold .32s cubic-bezier(.4,0,.2,1) both; }
        .ct-draw { animation: ct-draw .6s cubic-bezier(.4,0,.2,1) var(--ct-delay, 1.1s) both; }
        .ct-halo { animation: ct-halo 3.2s ease-out 1.8s infinite; }
        @supports (animation-timeline: view()) {
          .ct-edge-rise {
            animation: ct-up linear both;
            animation-timeline: view();
            animation-range: entry 35% cover 40%;
          }
        }
      }
      /* From the far (left) end towards the words: he faces right, pushing his cart that way. */
      @keyframes ct-roll {
        0% { opacity: 0; transform: translateX(-5rem); }
        20% { opacity: 1; }
        82% { transform: translateX(.35rem); }
        100% { transform: none; }
      }
      @keyframes ct-bob {
        from { translate: 0 0; }
        to { translate: 0 -2px; }
      }
      @keyframes ct-drop {
        0% { opacity: 0; transform: translateY(-2rem) rotate(-6deg); }
        45% { opacity: 1; transform: translateY(.3rem) rotate(2deg); }
        70% { transform: translateY(-.1rem) rotate(-.8deg); }
        100% { transform: none; }
      }
      /* The clip's bottom stays on the edge (97% of his box, which is sunk 3%) while he moves up through it. */
      @keyframes ct-up {
        0% { transform: translateY(100%); clip-path: inset(-40% -40% 103% -40%); }
        80% { transform: translateY(-3%); clip-path: inset(-40% -40% 0% -40%); }
        90% { transform: none; clip-path: inset(-40% -40% 3% -40%); }
        100% { transform: none; clip-path: inset(-40% -40% -10% -40%); }
      }
      /* Up off the strip in an arc, down onto it, a squash as he lands, then still (his breath takes over). */
      @keyframes ct-leap {
        0% { opacity: 0; transform: translate(-2.5rem, 35%) rotate(8deg); }
        15% { opacity: 1; }
        50% { transform: translate(-.5rem, -22%) rotate(-4deg); }
        78% { transform: translate(0, 2%) scale(1.03, .95); }
        90% { transform: translate(0, -1%) scale(.99, 1.02); }
        100% { transform: none; }
      }
      @keyframes ct-fold {
        from { grid-template-rows: 1fr; opacity: 1; }
        to { grid-template-rows: 0fr; opacity: 0; }
      }
      /* Right to left: the way the road reads. */
      @keyframes ct-draw {
        from { clip-path: inset(0 0 0 100%); }
        to { clip-path: inset(0); }
      }
      @keyframes ct-halo {
        0% { transform: scale(1); opacity: .8; }
        70%, 100% { transform: scale(1.5); opacity: 0; }
      }
    `}</style>
  );
}
