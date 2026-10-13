/*===== Detail Section =====*/
/**
 * A titled block of the page: an `h2`, an optional link or note at the end, and the block's own card below it. Used by
 * every section after the header so their headings, spacing and labelling are the same.
 */
export function DetailSection({
  id,
  title,
  action,
  children,
}: {
  /** Prefix for the heading's id, which labels the section. */
  id: string;
  title: string;
  /** A quiet link at the end of the heading row. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 id={`${id}-title`} className="text-lg font-extrabold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
