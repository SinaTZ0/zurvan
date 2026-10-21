/*===== Page Motion =====*/
/**
 * The page's own motion, one `<style>` for the whole slice (the shared loops and answers live in app.css):
 *
 * - **Load moment:** the guide dog rises from behind the path's edge (`as-rise`, the clip moving with him so nothing
 *   shows below the edge until he is up) and his bubble pops at 0.4s (the shared `answer-pop`, delayed).
 * - **Sent:** the form plates fade out (`as-leave`) and the receipt rises in (the shared `answer-in`); the seal stamps
 *   onto the receipt (`as-seal`) while the stamp dog's paw presses (`as-press`); the header road's gold walks one stop
 *   on (`as-draw` draws the new gold segment, `as-fill` turns the discs).
 * - **Scroll (phones):** each plate's dog rises from behind its edge as it scrolls in (`as-edge-rise`), where the
 *   browser can tie it to the scroll; elsewhere he is simply there.
 * - **Idle:** the lit stop's halo breathes (`as-halo`).
 *
 * Everything is off for reduced motion, which shows the finished page.
 */
export function PageMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .as-rise { animation: as-rise .75s cubic-bezier(.25,.8,.35,1) .05s both; }
        .as-leave { animation: as-leave .26s cubic-bezier(.4,0,1,1) both; }
        .as-halo { animation: as-halo 3.2s ease-out infinite; }
        .as-draw { animation: as-draw .5s cubic-bezier(.4,0,.2,1) var(--as-delay, .15s) both; }
        .as-fill {
          animation: answer-pop .4s cubic-bezier(.3,1.45,.5,1) var(--as-delay, 0s) both;
        }
        .as-seal { animation: as-seal .55s cubic-bezier(.3,1.2,.5,1) .5s both; }
        .as-press { transform-origin: 50% 100%; animation: as-press .55s ease-in-out .38s both; }
        @supports (animation-timeline: view()) {
          .as-edge-rise {
            animation: as-rise linear both;
            animation-timeline: view();
            animation-range: entry 35% cover 40%;
          }
        }
      }
      /* The clip's bottom stays on the edge (97% of his box, which is sunk 3%) while he moves up through it. */
      @keyframes as-rise {
        0% { transform: translateY(100%); clip-path: inset(-40% -40% 103% -40%); }
        80% { transform: translateY(-3%); clip-path: inset(-40% -40% 0% -40%); }
        90% { transform: none; clip-path: inset(-40% -40% 3% -40%); }
        100% { transform: none; clip-path: inset(-40% -40% -10% -40%); }
      }
      @keyframes as-leave {
        to { opacity: 0; transform: translateY(.75rem); }
      }
      @keyframes as-halo {
        0% { transform: scale(1); opacity: .8; }
        70%, 100% { transform: scale(1.5); opacity: 0; }
      }
      /* Right to left: the way the road reads. */
      @keyframes as-draw {
        from { clip-path: inset(0 0 0 100%); }
        to { clip-path: inset(0); }
      }
      @keyframes as-seal {
        0% { opacity: 0; transform: scale(1.4) rotate(-24deg); }
        60% { opacity: 1; transform: scale(.94) rotate(-8deg); }
        100% { opacity: 1; transform: none; }
      }
      @keyframes as-press {
        0%, 100% { transform: none; }
        40% { transform: translateY(4%) scale(1.01, .96); }
        70% { transform: translateY(-1%); }
      }
    `}</style>
  );
}
