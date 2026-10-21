import { useEffect, useState } from "react";

/*===== Timing =====*/
/** How long a removed row or bag takes to fold away (`ct-fold`, page-motion.tsx). */
const FOLD_MS = 320;

/** A list entry, or the last copy of one that was just removed and is folding away. */
export type Folding<Item> = { item: Item; key: string; leaving: boolean };

/*===== Use Folding =====*/
/**
 * Keeps a removed entry on screen a moment longer so it can fold away instead of vanishing. The cart atom drops an item
 * at once (and focus moves to the neighbouring «برداشتن» in the same render), so the slice keeps its own short-lived
 * copy: the entry stays where it was, marked `leaving`, until the fold is over. Leaving copies are drawn inert and
 * without `data-cart-remove`, so focus management never lands on them.
 *
 * Compared by keys, not by the list's identity (the page derives its lists on every render): when the keys change, the
 * ones that went are put back at their old places as leaving copies (state adjusted during render), and a timer forgets
 * them. Entries that stay always show the current item. Reduced motion keeps no copies: the entry simply goes.
 */
export function useFolding<Item>(list: readonly Item[], keyOf: (item: Item) => string): Folding<Item>[] {
  const keys = list.map(keyOf);
  const signature = keys.join("\n");
  const [state, setState] = useState<{ signature: string; shown: Folding<Item>[] }>(() => ({
    signature,
    shown: list.map((item, index) => ({ item, key: keys[index]!, leaving: false })),
  }));

  let shown = state.shown;
  if (state.signature !== signature) {
    const kept = new Set(keys);
    const still = typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next: Folding<Item>[] = list.map((item, index) => ({ item, key: keys[index]!, leaving: false }));

    if (!still) {
      // Every earlier entry is in `next` by now (kept, or put back as leaving), so its old index is its place.
      state.shown.forEach((entry, index) => {
        if (kept.has(entry.key)) return;
        next.splice(Math.min(index, next.length), 0, { ...entry, leaving: true });
      });
    }
    shown = next;
    setState({ signature, shown: next });
  }

  /*------ Forget the Copies ------*/
  // Keyed by which entries are leaving, so a second removal during a fold restarts the timer for both.
  const leaving = shown
    .filter((entry) => entry.leaving)
    .map((entry) => entry.key)
    .join("\n");
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(
      () => setState((current) => ({ ...current, shown: current.shown.filter((entry) => !entry.leaving) })),
      FOLD_MS,
    );
    return () => window.clearTimeout(timer);
  }, [leaving]);

  /*------ Fresh Items ------*/
  // A kept entry shows this render's item (a new review, say), never the copy stored when the keys last changed.
  const current = new Map(list.map((item, index) => [keys[index]!, item]));
  return shown.map((entry) => (entry.leaving ? entry : { ...entry, item: current.get(entry.key) ?? entry.item }));
}
