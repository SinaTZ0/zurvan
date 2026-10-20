import { cn } from "cn";
import { useSearchParams } from "react-router";

import { StoryClosing, StoryFooter, StoryTrainer } from "~/routes/design_lab/components/story/story-closing";
import { StoryHeader } from "~/routes/design_lab/components/story/story-header";
import { StoryHero } from "~/routes/design_lab/components/story/story-hero";
import { StoryFormats, StoryPath, StoryServices } from "~/routes/design_lab/components/story/story-sections";
import type { Palette } from "~/routes/design_lab/components/story/story-palettes";
import { GroundStrip } from "~/routes/design_lab/components/story/story-parts";
import { StoryRunner } from "~/routes/design_lab/components/story/story-runner";
import { GRAIN, LIVELY_CSS, THEME_CSS } from "~/routes/design_lab/components/story/story-theme";

/*===== Palette Choice =====*/
/** `?palette=1`, `2`… (1-based, so the link reads like the picker); anything else opens the first. */
function paletteIndex({ value, count }: { value: string | null; count: number }) {
  const index = Number(value) - 1;
  return Number.isInteger(index) && index >= 0 && index < count ? index : 0;
}

/*===== Palette Picker =====*/
/**
 * Lab chrome, not part of the design: a neutral pill above the design switch that swaps the palette. The choice
 * lives in the URL, so a link to one palette can be sent to the owner.
 */
function PalettePicker({
  palettes,
  current,
  onPick,
}: {
  palettes: readonly Palette[];
  current: number;
  onPick: (index: number) => void;
}) {
  const active = palettes[current];
  return (
    <div
      className="fixed inset-x-0 bottom-[4.25rem] z-[100] flex justify-center px-4"
      style={{ fontFamily: "Vazirmatn Variable, system-ui, sans-serif" }}
    >
      <fieldset className="flex max-w-full [scrollbar-width:none] items-center gap-1.5 overflow-x-auto rounded-full border border-white/15 bg-neutral-900/85 py-1 ps-1 pe-4 text-sm text-white shadow-lg backdrop-blur">
        <legend className="sr-only">پالت رنگ</legend>
        {palettes.map((palette, index) => (
          <button
            key={palette.name}
            type="button"
            aria-pressed={index === current}
            aria-label={`پالت ${palette.name}`}
            title={palette.hint}
            onClick={() => onPick(index)}
            className={cn(
              "flex h-7 shrink-0 items-center gap-1 rounded-full border border-white/25 ps-1 pe-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-white",
              index === current ? "bg-white text-neutral-900" : "hover:bg-white/10",
            )}
          >
            {/* Half the night ground, half its gold. Styles of one pairing share a swatch, so the number tells them apart. */}
            <span
              aria-hidden
              className="size-4 rounded-full border border-white/30"
              style={{
                background: `linear-gradient(135deg, ${palette.tokens["--st-paper"]} 50%, ${palette.tokens["--st-red"]} 50%)`,
              }}
            />
            {(index + 1).toLocaleString("fa-IR")}
          </button>
        ))}
        <span aria-live="polite" className="ms-1 whitespace-nowrap">
          {active.name}
          <span className="ms-2 hidden text-white/60 sm:inline">{active.hint}</span>
        </span>
      </fieldset>
    </div>
  );
}

/*===== Story Night Home =====*/
/**
 * Design 4's storybook page in night only, in one of `palettes`: design 5 shows the five black-and-gold palettes,
 * design 6 the six styles of the chosen one. `Services` swaps the «چه چیزی یاد می‌دهیم؟» section (design 7's
 * pinned scroll scene); with a single palette there's nothing to pick, so the picker is left out. `ground` lays a
 * strip of path under the hero, so the hero's card stands on it and the steps start below it. `typed` adds the
 * hero's typewriter line (design 7). `lively` turns on design 7's motion: the idle loops (LIVELY_CSS), the scroll
 * reveals and Fandogh running after his ball between the steps and the services. `fit` makes the hero one laptop
 * screen tall (StoryHero).
 */
export function StoryNightHome({
  palettes,
  Services = StoryServices,
  ground = false,
  typed = false,
  lively = false,
  fit = false,
}: {
  palettes: readonly Palette[];
  Services?: () => React.ReactNode;
  ground?: boolean;
  typed?: boolean;
  lively?: boolean;
  fit?: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const current = paletteIndex({ value: searchParams.get("palette"), count: palettes.length });

  function pick(index: number) {
    setSearchParams({ palette: String(index + 1) }, { replace: true, preventScrollReset: true });
  }

  return (
    <div
      data-theme="dark"
      style={{ backgroundImage: GRAIN, ...palettes[current].tokens } as React.CSSProperties}
      className={cn(
        "st-root min-h-svh overflow-x-clip bg-(--st-paper) text-(--st-ink) transition-colors duration-300 motion-reduce:transition-none",
        lively && "st-lively",
      )}
    >
      <style>{THEME_CSS}</style>
      {lively && <style>{LIVELY_CSS}</style>}
      <StoryHeader />
      <main>
        <StoryHero typed={typed} fit={fit} />
        {/* Pulled up over the hero's bottom edge, so its card stands on the path. Not on phones, where it crowds the
            card's edge under the dog's paws (the owner's call, 2026-10-20). */}
        {ground && <GroundStrip className="z-10 -mt-7 max-sm:hidden md:-mt-9" />}
        <StoryPath />
        {lively && <StoryRunner />}
        <Services />
        <StoryFormats />
        <StoryTrainer />
        <StoryClosing />
      </main>
      {/* Extra room under the footer for the two stacked lab pills. */}
      <div className={cn(palettes.length > 1 && "pb-16")}>
        <StoryFooter />
      </div>
      {palettes.length > 1 && <PalettePicker palettes={palettes} current={current} onPick={pick} />}
    </div>
  );
}
