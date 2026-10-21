import { useState } from "react";
import { useLocation } from "react-router";

/*===== Has Navigated =====*/
/**
 * Whether the Admin has moved to another page since the shell mounted. The shell's answers (the rail's gold mark
 * growing in on the new page) play only after a move, never on the first load: a page-load moment has no place in a
 * work tool.
 *
 * Derived during render, not in an effect, so the new page's first render already knows and the mark mounts with its
 * animation instead of appearing for a frame and then restarting.
 */
export function useHasNavigated(): boolean {
  const { pathname } = useLocation();
  const [firstPathname] = useState(pathname);
  const [moved, setMoved] = useState(false);
  if (!moved && pathname !== firstPathname) setMoved(true);
  return moved;
}
