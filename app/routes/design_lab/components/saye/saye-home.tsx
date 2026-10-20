import { SayeFooter } from "./saye-footer";
import { SayeHero } from "./saye-hero";
import { SayeBand, SayeClosing, SayeFormats, SayeServices, SayeSteps, SayeTrainer } from "./saye-sections";

/*===== Saye Home =====*/
// Design 3, a poster series. Tokens live on the root so every section reads the same four inks; the page sets its own
// background and font because the app's `<html>` is dark.
export function SayeHome() {
  return (
    <div
      className="min-h-svh bg-black font-sans text-[var(--sy-paper)]"
      style={
        {
          "--sy-fawn": "#C9822F",
          "--sy-black": "#000000",
          "--sy-paper": "#EDE6D6",
          "--sy-red": "#B3261E",
        } as React.CSSProperties
      }
    >
      <main>
        <SayeHero />
        <SayeBand />
        <SayeSteps />
        <SayeServices />
        <SayeFormats />
        <SayeTrainer />
        <SayeClosing />
      </main>
      <SayeFooter />
    </div>
  );
}
