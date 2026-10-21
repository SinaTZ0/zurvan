/*===== Page Motion =====*/
/**
 * The page's own motion, one `<style>` for the whole slice (the shared loops and answers live in app.css):
 *
 * - **Load moment:** the print drops in and settles on its tape (`dd-drop`), the dog's bubble pops at 0.45s (the
 *   shared `answer-pop` with `--answer-delay`), the facts' numbers rise in one after another (`dd-num`).
 * - **Scroll:** each mascot rises from behind his plate's edge (`dd-rise`), the diary's chalk line draws itself down
 *   (`dd-draw`); both scroll-driven where the browser can, elsewhere simply there.
 * - **Answers:** the evaluation dog sinks behind his card's edge once the request is withdrawn (`dd-sink`), the medals
 *   swing once on their ribbons when the band comes into view (`dd-swung`, set by `useInView`).
 * - **Idle:** the medals sway a little on their nails (`dd-sway`), out of step with each other.
 *
 * Everything is off for reduced motion, which shows the finished page (the sunk dog is hidden there by its own class).
 */
export function PageMotion() {
  return (
    <style>{`
      /* Not motion: the buddy corner shows its pieces only when the column leaves room for them. */
      .dd-corner { container-type: size; }
      .dd-corner-scene { display: none; }
      .dd-corner-sky { display: none; }
      @container (min-height: 6.5rem) { .dd-corner-scene { display: block; } }
      @container (min-height: 12rem) { .dd-corner-sky { display: block; } }
      @media (prefers-reduced-motion: no-preference) {
        .dd-drop { transform-origin: 50% 0; animation: dd-drop 1s cubic-bezier(.3,1.2,.5,1) .05s both; }
        .dd-num { animation: answer-in .5s cubic-bezier(.2,.8,.2,1) var(--dd-delay, 0s) both; }
        .dd-sink { animation: dd-sink .7s cubic-bezier(.5,0,.75,0) both; }
        .dd-sway { animation: dd-sway 3.6s ease-in-out infinite alternate; }
        .dd-swung .dd-medal { animation: dd-medal 1.7s cubic-bezier(.3,.6,.4,1) var(--dd-delay, 0s) both; }
        @supports (animation-timeline: view()) {
          .dd-rise {
            animation: dd-rise linear both;
            animation-timeline: view();
            animation-range: entry 35% cover 40%;
          }
          .dd-draw {
            animation: dd-draw linear both;
            animation-timeline: view();
            animation-range: entry 20% cover 60%;
          }
        }
      }
      @keyframes dd-drop {
        0% { opacity: 0; transform: translateY(-2.5rem) rotate(-6deg); }
        45% { opacity: 1; transform: translateY(.35rem) rotate(2.2deg); }
        70% { transform: translateY(-.1rem) rotate(-.9deg); }
        85% { transform: rotate(.35deg); }
        100% { transform: none; }
      }
      /* The clip's bottom stays on the edge (97% of his box, which is sunk 3%) while he moves up through it. */
      @keyframes dd-rise {
        0% { transform: translateY(100%); clip-path: inset(-40% -40% 103% -40%); }
        80% { transform: translateY(-3%); clip-path: inset(-40% -40% 0% -40%); }
        90% { transform: none; clip-path: inset(-40% -40% 3% -40%); }
        100% { transform: none; clip-path: inset(-40% -40% -10% -40%); }
      }
      @keyframes dd-sink {
        0% { transform: none; clip-path: inset(-40% -40% 3% -40%); }
        100% { transform: translateY(100%); clip-path: inset(-40% -40% 103% -40%); opacity: .4; }
      }
      @keyframes dd-draw {
        from { clip-path: inset(0 0 100% 0); }
        to { clip-path: inset(0); }
      }
      @keyframes dd-sway {
        from { transform: rotate(-2deg); }
        to { transform: rotate(2deg); }
      }
      @keyframes dd-medal {
        0% { transform: rotate(16deg); }
        22% { transform: rotate(-11deg); }
        42% { transform: rotate(7deg); }
        62% { transform: rotate(-4deg); }
        80% { transform: rotate(1.5deg); }
        100% { transform: none; }
      }
    `}</style>
  );
}
