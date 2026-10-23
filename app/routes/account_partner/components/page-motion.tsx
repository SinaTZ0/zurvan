/*===== Page Motion =====*/
/**
 * The page's own motion, one `<style>` for the slice (the shared loops and answers live in app.css):
 *
 * - **Load moment:** the wave dog waves (`pd-wave`, a few swings from his feet, then his idle tilt), his bubble pops at
 *   0.4s (`pd-hello`), the tally's numbers rise one after another (`pd-tally-*`); the notices rise in (the shared
 *   `answer-in`); the QR card drops onto the counter and settles on its tilt (`pd-drop`) and the dog's bubble there
 *   pops after it (`pd-scan`).
 * - **In view** (`useInView` marks the section `data-view="armed"`, then `"seen"`): each plate's dog rises from behind
 *   its edge (`pd-edge`) and then speaks (`pd-say`); the funnel's road draws itself in reading direction (`pd-seg-*`),
 *   its stops pop in turn (`pd-stop-*`) and the flag pops last (`pd-flag`); the commission slips rise one after another
 *   (`pd-slip`, `--pd-delay`).
 *
 * Everything is off for reduced motion, which shows the finished page. Nothing is hidden before the script runs: the
 * `armed` mark only exists once it has.
 */
export function PageMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .pd-wave { transform-origin: 50% 100%; animation: pd-wave 1.3s ease-in-out .15s both; }
        .pd-hello {
          transform-origin: 2.25rem 100%;
          animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .4s both, lively-float 3.4s ease-in-out .8s infinite alternate;
        }
        .pd-tally { animation: answer-in .45s cubic-bezier(.2,.8,.2,1) both; }
        .pd-tally-1 { animation-delay: .5s; }
        .pd-tally-2 { animation-delay: .6s; }
        .pd-tally-3 { animation-delay: .7s; }
        .pd-drop { animation: pd-drop 1.05s cubic-bezier(.3,1.1,.5,1) .3s both; }
        .pd-scan {
          transform-origin: calc(100% - 2.25rem) 100%;
          animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) 1.25s both, lively-float 3.4s ease-in-out 1.65s infinite alternate;
        }
        .pd-say {
          transform-origin: 2.25rem 100%;
          animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .75s both, lively-float 3.4s ease-in-out 1.15s infinite alternate;
        }
        /* English: the plates' bubbles open to the left, their tail on the right. */
        [dir="ltr"] .pd-say { transform-origin: calc(100% - 2.25rem) 100%; }

        /*------ Armed: what will arrive waits out of sight ------*/
        [data-view="armed"] .pd-edge { transform: translateY(100%); clip-path: inset(-40% -40% 103% -40%); }
        [data-view="armed"] .pd-seg { clip-path: inset(0 0 0 100%); }
        [data-view="armed"] .pd-stop,
        [data-view="armed"] .pd-flag,
        [data-view="armed"] .pd-slip { opacity: 0; }

        /*------ Seen: it arrives ------*/
        [data-view="seen"] .pd-edge { animation: pd-rise .8s cubic-bezier(.25,.8,.35,1) both; }
        [data-view="seen"] .pd-seg { animation: pd-draw .45s cubic-bezier(.4,0,.6,1) both; }
        [data-view="seen"] .pd-seg-0 { animation-delay: .35s; }
        [data-view="seen"] .pd-seg-1 { animation-delay: .8s; }
        [data-view="seen"] .pd-seg-2 { animation-delay: 1.25s; }
        [data-view="seen"] .pd-stop { animation: pd-pop .45s cubic-bezier(.3,1.45,.5,1) both; }
        [data-view="seen"] .pd-stop-0 { animation-delay: .2s; }
        [data-view="seen"] .pd-stop-1 { animation-delay: .7s; }
        [data-view="seen"] .pd-stop-2 { animation-delay: 1.15s; }
        [data-view="seen"] .pd-flag { animation: pd-pop .5s cubic-bezier(.3,1.45,.5,1) 1.6s both, lively-sway 4.2s ease-in-out 2.1s infinite alternate-reverse; transform-origin: 75% 100%; }
        [data-view="seen"] .pd-slip { animation: pd-slip .55s cubic-bezier(.2,.8,.2,1) var(--pd-delay, .3s) both; }
      }
      @keyframes pd-wave {
        0%, 100% { transform: none; }
        18% { transform: rotate(-4deg); }
        36% { transform: rotate(3deg); }
        54% { transform: rotate(-2.5deg); }
        72% { transform: rotate(1.5deg); }
      }
      @keyframes pd-drop {
        0% { opacity: 0; transform: translateY(-3rem) rotate(-7deg); }
        45% { opacity: 1; transform: translateY(.3rem) rotate(2deg); }
        68% { transform: translateY(-.15rem) rotate(-.8deg); }
        85% { transform: rotate(.3deg); }
        100% { transform: none; }
      }
      /* The clip's bottom stays on the edge (97% of his box, which is sunk 3%) while he moves up through it. */
      @keyframes pd-rise {
        0% { transform: translateY(100%); clip-path: inset(-40% -40% 103% -40%); }
        80% { transform: translateY(-3%); clip-path: inset(-40% -40% 0% -40%); }
        90% { transform: none; clip-path: inset(-40% -40% 3% -40%); }
        100% { transform: none; clip-path: inset(-40% -40% -10% -40%); }
      }
      /* Right to left: the line grows from the stop it leaves towards the next, in reading direction. */
      @keyframes pd-draw {
        from { clip-path: inset(0 0 0 100%); }
        to { clip-path: inset(0); }
      }
      @keyframes pd-pop {
        from { opacity: 0; transform: scale(.4); }
        70% { opacity: 1; transform: scale(1.08); }
        to { opacity: 1; transform: none; }
      }
      @keyframes pd-slip {
        from { opacity: 0; transform: translateY(1.25rem); }
        to { opacity: 1; transform: none; }
      }
    `}</style>
  );
}
