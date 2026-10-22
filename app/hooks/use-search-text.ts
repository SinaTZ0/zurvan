import { useEffect, useRef, useState } from "react";

/*===== Search Text =====*/
/**
 * The search box's text, for an Admin list that filters as he types (Dogs, Users) while the URL's `q` follows only after a pause. The text
 * changes on every key; `commit` (a `replace` navigation, so typing never stacks history entries) runs once typing has
 * stopped for `delayMs`. `set` commits at once (the clear button).
 *
 * A `q` that changes in the URL from elsewhere (Back to an earlier page of the list, a link) becomes the text. The
 * page's own commits don't, so a key pressed while a commit lands isn't undone.
 *
 * @returns `text` (what the box shows and the list filters by), `typing` (a commit is still waiting, so the URL's other
 * params, like `page`, are about to be reset), `change` (debounced) and `set` (at once).
 */
export function useSearchText({
  urlText,
  delayMs,
  commit,
}: {
  urlText: string;
  delayMs: number;
  commit: (text: string) => void;
}) {
  const [text, setText] = useState(urlText);
  const [seen, setSeen] = useState({ urlText, committed: urlText });
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /*------ URL Changes ------*/
  // Derived during render (React's "adjust state on a prop change" pattern), so the box never shows a stale frame.
  if (urlText !== seen.urlText) {
    setSeen({ urlText, committed: seen.committed });
    if (urlText !== seen.committed) setText(urlText);
  }

  // A waiting commit must not navigate after the page is gone.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  /*------ Writes ------*/
  function commitNow(next: string) {
    clearTimeout(timerRef.current);
    timerRef.current = undefined;
    setSeen((previous) => ({ ...previous, committed: next }));
    commit(next);
  }

  function change(next: string) {
    setText(next);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => commitNow(next), delayMs);
  }

  function set(next: string) {
    setText(next);
    commitNow(next);
  }

  return { text, typing: text !== urlText, change, set };
}
