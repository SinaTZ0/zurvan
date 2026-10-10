/*===== Theme =====*/
// The theme lives on <html> (`.dark` class + `color-scheme`). With no saved choice the site is light,
// whatever the system setting: the layered stone-and-white surfaces read clearest by day. Once the user
// picks a theme with the toggle, that choice wins from then on.
// Browser-only except `THEME_INIT_SCRIPT`, which root.tsx inlines into the server-rendered <head>.

export type Theme = "light" | "dark";

const STORAGE_KEY = "zurvan-theme";
// Widened to `Theme` so the first-paint script below keeps both branches if the default changes again.
const DEFAULT_THEME = "light" as Theme;
// Notifies other components in this tab; the `storage` event only fires in other tabs.
const CHANGE_EVENT = "zurvan:theme-change";

/*===== First Paint =====*/
/**
 * Runs before the page paints, so neither theme flashes. The server can't read the saved choice
 * (it's in localStorage), so this has to happen in the browser. Mirrors `resolveTheme` and
 * `applyTheme`; if storage is blocked, the page still gets the default.
 */
export const THEME_INIT_SCRIPT = `(function(){var d=${JSON.stringify(DEFAULT_THEME === "dark")};try{var s=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});if(s==="dark"||s==="light")d=s==="dark"}catch(e){}var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"})()`;

/*===== Helpers =====*/
function readSavedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // Storage can be blocked (privacy modes); fall back to the default theme.
    return null;
  }
}

function resolveTheme(): Theme {
  return readSavedTheme() ?? DEFAULT_THEME;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  // Native controls, scrollbars, and autofill follow `color-scheme`.
  root.style.colorScheme = theme;
}

/*===== Store =====*/
/** The theme currently applied to the document. */
export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Applies and saves the user's choice; from now on it overrides the default. */
export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not saved, but still applied for this page view.
  }
  applyTheme(theme);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Subscribes to theme changes: the toggle and a choice made in another tab. Shaped for
 * `useSyncExternalStore`.
 */
export function subscribeToTheme(onChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    applyTheme(resolveTheme());
    onChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
