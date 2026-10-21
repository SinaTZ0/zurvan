/*===== Page Motion =====*/
/**
 * The page's own motion, one `<style>` for the whole slice (the shared loops and answers live in app.css):
 *
 * - **Load moment:** the ledger dog's paw turns a page (`ap-page`, a dip at his front), his bubble pops at 0.4s
 *   (`ap-pop`), the tally's numbers rise one after another (`ap-rise-*`); the first slips slide up staggered (`ap-slip`,
 *   the shared `answer-in` with `--answer-delay`) and each paid slip's seal stamps as it lands (`ap-seal`, `--ap-delay`);
 *   the receipt dog rises from behind the newest slip's edge (`ap-receipt`) and his bubble pops once he is up. An empty
 *   account's plate rises in and its dog's bubble pops after it.
 * - **Scroll:** later slips rise in (`lively-reveal`) and their seals stamp as they show (`ap-seal-view`); the closing
 *   dog rises over the coping (`ap-edge-rise`). Both scroll-driven where the browser can; elsewhere simply there.
 *
 * Everything is off for reduced motion, which shows the finished page.
 */
export function PageMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .ap-page { transform-origin: 80% 100%; animation: ap-page 1s cubic-bezier(.3,.7,.4,1) .1s both; }
        .ap-pop {
          transform-origin: calc(100% - 2.25rem) 100%;
          animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .4s both, lively-float 3.4s ease-in-out .8s infinite alternate;
        }
        .ap-rise { animation: answer-in .45s cubic-bezier(.2,.8,.2,1) both; }
        .ap-rise-1 { animation-delay: .5s; }
        .ap-rise-2 { animation-delay: .6s; }
        .ap-rise-3 { animation-delay: .7s; }
        .ap-slip { animation: ap-slip .6s cubic-bezier(.2,.8,.2,1) var(--answer-delay, 0s) both; }
        .ap-seal { animation: ap-seal .55s cubic-bezier(.3,1.2,.5,1) var(--ap-delay, .6s) both; }
        .ap-receipt { animation: ap-rise .8s cubic-bezier(.25,.8,.35,1) .55s both; }
        .ap-receipt-pop { transform-origin: 2.25rem 100%; animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) 1.3s both; }
        .ap-empty-pop {
          transform-origin: calc(100% - 2.25rem) 100%;
          animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .95s both;
        }
        @supports (animation-timeline: view()) {
          .ap-edge-rise {
            animation: ap-rise linear both;
            animation-timeline: view();
            animation-range: entry 35% cover 40%;
          }
          .ap-seal-view {
            animation: ap-seal linear both;
            animation-timeline: view();
            animation-range: entry 30% cover 35%;
          }
        }
      }
      @keyframes ap-page {
        0%, 100% { transform: none; }
        25% { transform: translateY(2%) rotate(-1.5deg) scale(1.01, .97); }
        50% { transform: translateY(-1.5%) rotate(1deg); }
        75% { transform: translateY(.5%); }
      }
      @keyframes ap-slip {
        from { opacity: 0; transform: translateY(1.75rem) rotate(-.6deg); }
        to { opacity: 1; transform: none; }
      }
      @keyframes ap-seal {
        0% { opacity: 0; transform: scale(1.5) rotate(-26deg); }
        60% { opacity: 1; transform: scale(.93) rotate(-4deg); }
        100% { opacity: 1; transform: none; }
      }
      /* The clip's bottom stays on the edge (97% of his box, which is sunk 3%) while he moves up through it. */
      @keyframes ap-rise {
        0% { transform: translateY(100%); clip-path: inset(-40% -40% 103% -40%); }
        80% { transform: translateY(-3%); clip-path: inset(-40% -40% 0% -40%); }
        90% { transform: none; clip-path: inset(-40% -40% 3% -40%); }
        100% { transform: none; clip-path: inset(-40% -40% -10% -40%); }
      }
    `}</style>
  );
}
