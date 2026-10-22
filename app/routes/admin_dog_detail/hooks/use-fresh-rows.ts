import { useState } from "react";

/*===== Types =====*/
export type FreshRows = {
  /** Rows that weren't there before the last change of the list (a session just written). */
  added: ReadonlySet<string>;
  /** Rows whose version moved in the last change (a session just corrected). */
  edited: ReadonlySet<string>;
};

const NONE: FreshRows = { added: new Set(), edited: new Set() };

/*===== Fresh Rows =====*/
/**
 * Which rows the last refetch added or changed, compared with the list as it was before it; nothing on the first
 * render, so no row moves on load. The marks stay until the list changes again, so a re-render for another reason
 * doesn't replay or cut short a motion.
 */
export function useFreshRows<T>({
  rows,
  id,
  version,
}: {
  rows: readonly T[];
  id: (row: T) => string;
  /** Moves whenever the row is saved again (its `updatedAt`). */
  version: (row: T) => number;
}): FreshRows {
  const [snapshot, setSnapshot] = useState(() => new Map(rows.map((row) => [id(row), version(row)])));
  const [fresh, setFresh] = useState<FreshRows>(NONE);

  const moved = rows.length !== snapshot.size || rows.some((row) => snapshot.get(id(row)) !== version(row));
  if (moved) {
    const added = new Set<string>();
    const edited = new Set<string>();
    for (const row of rows) {
      const before = snapshot.get(id(row));
      if (before === undefined) added.add(id(row));
      else if (before !== version(row)) edited.add(id(row));
    }
    setSnapshot(new Map(rows.map((row) => [id(row), version(row)])));
    setFresh({ added, edited });
  }

  return fresh;
}
