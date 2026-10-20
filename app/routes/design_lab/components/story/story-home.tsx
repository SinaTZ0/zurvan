import { useSyncExternalStore } from "react";

import { GRAIN, THEME_CSS } from "~/routes/design_lab/components/story/story-theme";
import { StoryClosing, StoryFooter, StoryTrainer } from "~/routes/design_lab/components/story/story-closing";
import { StoryHeader } from "~/routes/design_lab/components/story/story-header";
import { StoryHero } from "~/routes/design_lab/components/story/story-hero";
import { StoryFormats, StoryPath, StoryServices } from "~/routes/design_lab/components/story/story-sections";

const THEME_KEY = "zurvan-lab-story-theme";

/*===== Theme =====*/
// The chosen theme, as a tiny external store: the server and the first client render see null (the system theme, by
// CSS), then React reads the real choice. `?theme=dark` (or `light`) wins for that visit without being saved, so the
// owner can be sent a link to either version; a click wins over both.
type StoryTheme = "light" | "dark";

const listeners = new Set<() => void>();
let clicked: StoryTheme | null = null;

function asTheme(value: string | null): StoryTheme | null {
  return value === "light" || value === "dark" ? value : null;
}

function readTheme(): StoryTheme | null {
  if (clicked) return clicked;
  const fromUrl = asTheme(new URLSearchParams(window.location.search).get("theme"));
  if (fromUrl) return fromUrl;
  try {
    return asTheme(window.localStorage.getItem(THEME_KEY));
  } catch {
    // Storage can be blocked (private mode); the system theme still applies.
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Flips day and night from whatever is showing now (a saved choice, or the system's) and remembers it. */
function toggleTheme() {
  const current = readTheme() ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  clicked = current === "dark" ? "light" : "dark";
  try {
    window.localStorage.setItem(THEME_KEY, clicked);
  } catch {
    // Not saved; the switch still works for this visit.
  }
  for (const listener of listeners) listener();
}

/*===== Story Home =====*/
/** Design 4: a storybook page where Fandogh, a Malinois, sits on the layout's edges and talks to the visitor. */
export function StoryHome() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => null);

  return (
    <div
      data-theme={theme ?? undefined}
      style={{ backgroundImage: GRAIN }}
      className="st-root min-h-svh overflow-x-clip bg-(--st-paper) text-(--st-ink) transition-colors duration-300 motion-reduce:transition-none"
    >
      <style>{THEME_CSS}</style>
      <StoryHeader onToggleTheme={toggleTheme} />
      <main>
        <StoryHero />
        <StoryPath />
        <StoryServices />
        <StoryFormats />
        <StoryTrainer />
        <StoryClosing />
      </main>
      <StoryFooter />
    </div>
  );
}
