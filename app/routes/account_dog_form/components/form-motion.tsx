/*===== Form Motion =====*/
/**
 * The page's own motion, one `<style>` for the whole slice (the shared loops and answers live in app.css):
 *
 * - **Load moment:** the print drops onto the mount and settles on its tape (`df-drop`); the identity dog's bubble
 *   pops at 0.4s (the shared `answer-pop` with `--answer-delay`, set by the plate).
 * - **Answers:** a new photo re-drops the print (it is keyed by the photo's id); a picked pill's tick pops in
 *   (`df-tick`, which starts whenever the tick goes from hidden to shown); the plates' bubbles pop and fade through the
 *   shared `answer-pop` and an opacity transition.
 * - **Scroll:** each plate's dog rises from behind the plate's edge as it comes into view (`df-rise`, scroll-driven
 *   where the browser can, elsewhere simply there). The clip moves with him, so nothing shows below the edge.
 *
 * Everything is off for reduced motion, which shows the finished page.
 */
export function FormMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .df-drop { transform-origin: 50% 0; animation: df-drop 1s cubic-bezier(.3,1.2,.5,1) .05s both; }
        .df-tick { animation: df-tick .32s cubic-bezier(.3,1.6,.5,1) both; }
        .df-fade { transition: opacity .3s ease-out; }
        @supports (animation-timeline: view()) {
          .df-rise {
            animation: df-rise linear both;
            animation-timeline: view();
            animation-range: entry 35% cover 40%;
          }
        }
      }
      @keyframes df-drop {
        0% { opacity: 0; transform: translateY(-2.5rem) rotate(6deg); }
        45% { opacity: 1; transform: translateY(.35rem) rotate(-2.2deg); }
        70% { transform: translateY(-.1rem) rotate(.9deg); }
        85% { transform: rotate(-.35deg); }
        100% { transform: none; }
      }
      @keyframes df-tick {
        from { opacity: 0; transform: scale(0) rotate(-30deg); }
        to { opacity: 1; transform: none; }
      }
      /* The clip's bottom stays on the edge (97% of his box, which is sunk 3%) while he moves up through it. */
      @keyframes df-rise {
        0% { transform: translateY(100%); clip-path: inset(-40% -40% 103% -40%); }
        80% { transform: translateY(-3%); clip-path: inset(-40% -40% 0% -40%); }
        90% { transform: none; clip-path: inset(-40% -40% 3% -40%); }
        100% { transform: none; clip-path: inset(-40% -40% -10% -40%); }
      }
    `}</style>
  );
}
