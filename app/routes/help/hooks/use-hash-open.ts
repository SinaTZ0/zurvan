import { useCallback, useEffect, useState } from "react";

/*===== Hash Helpers =====*/
/** The id in the URL's `#hash`, decoded; `null` when there is none. */
function readHashId(): string | null {
  const raw = window.location.hash.slice(1);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    // A malformed escape (`#%E0%A4%A`) is an unknown hash like any other.
    return null;
  }
}

/*===== Use Hash Open =====*/
/**
 * Which questions are open, kept in step with the URL's `#hash`.
 *
 * - A hash that names a question (`/help#how-buying-works`) opens it and scrolls it into view, on first load (after
 *   hydration) and on every later `hashchange` (a link from another page, the back button).
 * - A hash that names a group, or nothing we know, changes nothing here: the browser's own anchor jump (and `:target`)
 *   handles groups.
 * - Opening a question by hand writes its id into the hash with `replaceState`, so "copy link" works without a scroll
 *   jump or a history entry; closing the question the hash points at removes it.
 *
 * Several questions can be open at once.
 */
export function useHashOpen({ questionIds }: { questionIds: readonly string[] }) {
  const [openIds, setOpenIds] = useState<string[]>([]);

  /*------ From the URL ------*/
  useEffect(() => {
    function openFromHash() {
      const id = readHashId();
      if (id === null || !questionIds.includes(id)) return;

      setOpenIds((current) => (current.includes(id) ? current : [...current, id]));
      // After the open state has rendered; the item's `scroll-mt-24` keeps it clear of the top edge.
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    }

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [questionIds]);

  /*------ From the Person ------*/
  /**
   * Applies one group's accordion change. The accordion reports only its own group's open ids, so they're merged with
   * the other groups' instead of replacing them.
   */
  const changeGroup = useCallback(
    ({ groupQuestionIds, next }: { groupQuestionIds: readonly string[]; next: readonly string[] }) => {
      const opened = next.filter((id) => !openIds.includes(id));
      const closed = openIds.filter((id) => groupQuestionIds.includes(id) && !next.includes(id));

      // The URL follows the person's last choice: the question just opened, or no hash if the one it named closed.
      // Outside the state updater: a side effect has no place in a function React may run twice.
      if (opened.length > 0) {
        window.history.replaceState(null, "", `#${opened[opened.length - 1]}`);
      } else if (closed.some((id) => id === readHashId())) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      }

      setOpenIds([...openIds.filter((id) => !groupQuestionIds.includes(id)), ...next]);
    },
    [openIds],
  );

  return { openIds, changeGroup };
}
