import { FandoghClosing, FandoghFooter } from "~/routes/design_lab/components/fandogh/fandogh-closing";
import { FandoghHeader } from "~/routes/design_lab/components/fandogh/fandogh-header";
import { FandoghHero } from "~/routes/design_lab/components/fandogh/fandogh-hero";
import { FandoghFormats, FandoghServices, FandoghSteps } from "~/routes/design_lab/components/fandogh/fandogh-path";
import { FandoghTrainer } from "~/routes/design_lab/components/fandogh/fandogh-trainer";

/*===== Tokens =====*/
// Sky, fawn and leaf come from the mascot himself: sky for the page he walks through, fawn for his coat, leaf green for
// the leash (so green means "go", on every button). The ink is the colour of his mask. No cream, no terracotta.
const TOKENS = {
  "--fd-sky": "#9CC9E8",
  "--fd-sky-soft": "#DCEDF8",
  "--fd-fawn": "#D9944A",
  "--fd-ink": "#1D1A17",
  "--fd-leaf": "#3E8E5A",
  // Buttons carry white text, so they use a deeper leaf that clears 4.5:1; the brand leaf stays for fills and lines.
  "--fd-leaf-deep": "#2D7648",
} as React.CSSProperties;

/*===== Fandogh Home =====*/
/** Design 2: a picture book in which Fandogh, a young Belgian Malinois, walks the visitor through the page. */
export function FandoghHome() {
  return (
    <div style={TOKENS} className="bg-white font-sans text-[var(--fd-ink)]" dir="rtl">
      {/* The single load moment: the bubble pops, then Fandogh rises into the frame. Both off for reduced motion. */}
      <style>{`
        @keyframes fd-pop { from { opacity: 0; transform: scale(.85) } to { opacity: 1; transform: scale(1) } }
        @keyframes fd-rise { from { transform: translateY(28px) } to { transform: none } }
        @media (prefers-reduced-motion: no-preference) {
          .fd-pop { animation: fd-pop .5s .35s cubic-bezier(.3,1.5,.5,1) backwards }
          .fd-rise { animation: fd-rise .6s cubic-bezier(.2,.8,.3,1) backwards }
        }
      `}</style>
      <FandoghHeader />
      <main>
        <FandoghHero />
        <FandoghSteps />
        <FandoghServices />
        <FandoghFormats />
        <FandoghTrainer />
        <FandoghClosing />
      </main>
      <FandoghFooter />
    </div>
  );
}
