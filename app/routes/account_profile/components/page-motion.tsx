/*===== Page Motion =====*/
/**
 * The page's own motion, one `<style>` for the slice (the shared loops and answers live in app.css):
 *
 * - **Load moment:** the tag swings on its peg once and settles, damped, around its ring (`pf-swing`), then keeps a
 *   slight sway (`pf-sway`); the name card's dog speaks at 0.4s (`pf-say-first`).
 * - **Answers:** the dog of the card the person is in pops his bubble from its tail (`pf-say`, keyed per line); the one
 *   who had the word fades out (`pf-quiet`). A saved name swings the tag again (re-keyed). Errors, alerts and the
 *   empty-Sheba notice rise in with the shared `answer-in`; the notice folds away once a Sheba is saved (`pf-fold`).
 * - **Scroll:** each card's dog rises from behind his plate's edge (`pf-rise`), scroll-driven where the browser can,
 *   elsewhere simply there.
 *
 * Everything is off for reduced motion, which shows the finished page: a quiet bubble is simply gone.
 */
export function PageMotion() {
  return (
    <style>{`
      .pf-quiet { opacity: 0; visibility: hidden; }
      .pf-fold { display: grid; grid-template-rows: 1fr; }
      .pf-fold[data-open="false"] { grid-template-rows: 0fr; visibility: hidden; }
      @media (prefers-reduced-motion: no-preference) {
        .pf-swing { animation: pf-swing 2.4s cubic-bezier(.35,.05,.4,1) .1s both; }
        .pf-sway { animation: pf-sway 4.6s ease-in-out 2.5s infinite alternate; }
        .pf-say {
          transform-origin: 1.75rem 100%;
          animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) both, lively-float 3.4s ease-in-out .5s infinite alternate;
        }
        .pf-say-first { animation-delay: .4s, .9s; }
        .pf-quiet {
          transform-origin: 1.75rem 100%;
          animation: pf-hush .26s ease-in both;
        }
        .pf-fold { transition: grid-template-rows .4s cubic-bezier(.2,.8,.2,1), visibility 0s; }
        .pf-fold[data-open="false"] { transition: grid-template-rows .4s cubic-bezier(.2,.8,.2,1), visibility 0s linear .4s; }
        .pf-fold > * { transition: opacity .3s ease, translate .3s ease; }
        .pf-fold[data-open="false"] > * { opacity: 0; translate: 0 -.4rem; }
        @supports (animation-timeline: view()) {
          .pf-rise {
            animation: pf-rise linear both;
            animation-timeline: view();
            animation-range: entry 30% cover 35%;
          }
        }
      }
      @keyframes pf-swing {
        0% { transform: rotate(10deg); }
        17% { transform: rotate(-7deg); }
        34% { transform: rotate(4.6deg); }
        51% { transform: rotate(-2.8deg); }
        68% { transform: rotate(1.5deg); }
        84% { transform: rotate(-.6deg); }
        100% { transform: none; }
      }
      @keyframes pf-sway {
        from { transform: rotate(-.7deg); }
        to { transform: rotate(.7deg); }
      }
      @keyframes pf-hush {
        from { opacity: 1; visibility: visible; transform: none; }
        to { opacity: 0; visibility: hidden; transform: scale(.85); }
      }
      /* The clip's bottom stays on the edge (97% of his box, which is sunk 3%) while he moves up through it. */
      @keyframes pf-rise {
        0% { transform: translateY(100%); clip-path: inset(-40% -40% 103% -40%); }
        80% { transform: translateY(-3%); clip-path: inset(-40% -40% 0% -40%); }
        90% { transform: none; clip-path: inset(-40% -40% 3% -40%); }
        100% { transform: none; clip-path: inset(-40% -40% -10% -40%); }
      }
    `}</style>
  );
}
