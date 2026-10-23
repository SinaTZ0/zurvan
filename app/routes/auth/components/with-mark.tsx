import type { ReactNode } from "react";

/*===== Sentence With an Element =====*/
// A message can't hold markup, so a sentence with the phone number (or the demo code's button) in it is written with a
// mark where that goes, and the mark is swapped here for the element. The words around it differ in order between the
// languages.
const MARK = "\u0001";

/** Renders `text(mark)` with `children` in place of the mark. */
export function WithMark({ text, children }: { text: (mark: string) => string; children: ReactNode }) {
  const [before = "", after = ""] = text(MARK).split(MARK);
  return (
    <>
      {before}
      {children}
      {after}
    </>
  );
}
