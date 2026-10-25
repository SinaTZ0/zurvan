/*===== Query in a Sentence =====*/
// The search is the visitor's own text, shown as typed inside `bdi`, so a Latin search like «CGC» doesn't reorder the
// Persian around it (nor a Persian one the English). A message can't hold markup, so it is written with a mark where
// the query goes, and the mark is swapped here for the isolated text (as the course catalogue's counter does).
const QUERY_MARK = "\u0001";

export function WithQuery({ text, query }: { text: (mark: string) => string; query: string }) {
  const [before = "", after = ""] = text(QUERY_MARK).split(QUERY_MARK);
  return (
    <>
      {before}
      <bdi>{query}</bdi>
      {after}
    </>
  );
}
