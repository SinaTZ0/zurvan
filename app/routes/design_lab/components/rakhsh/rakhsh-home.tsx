import { RakhshFooter } from "~/routes/design_lab/components/rakhsh/rakhsh-footer";
import { RakhshHeader } from "~/routes/design_lab/components/rakhsh/rakhsh-header";
import { RakhshHero } from "~/routes/design_lab/components/rakhsh/rakhsh-hero";
import {
  RakhshClosing,
  RakhshFormats,
  RakhshServices,
  RakhshSteps,
  RakhshTrainer,
} from "~/routes/design_lab/components/rakhsh/rakhsh-sections";

/*===== Rakhsh Home =====*/
/**
 * Design 1: "the dog's own file". Rakhsh, a Belgian Malinois, speaks in first person. All the boldness is in the
 * hero's dog tag; the rest is calm olive/bone bands so the tag stays the one memorable thing.
 */
export function RakhshHome() {
  return (
    <div
      dir="rtl"
      className="min-h-svh bg-[var(--rk-olive)] font-sans text-[var(--rk-bone)] antialiased"
      style={
        {
          "--rk-olive": "#2F3A2A",
          "--rk-olive-deep": "#232C20",
          "--rk-sand": "#D9C7A3",
          "--rk-bone": "#F2EDE3",
          "--rk-ink": "#1B2018",
          "--rk-mask": "#000000",
          "--rk-signal": "#E2611B",
        } as React.CSSProperties
      }
    >
      <RakhshHeader />
      <main>
        <RakhshHero />
        <RakhshSteps />
        <RakhshServices />
        <RakhshFormats />
        <RakhshTrainer />
        <RakhshClosing />
      </main>
      <RakhshFooter />
    </div>
  );
}
