/*===== Section Head =====*/
/**
 * A public-record section's heading row: the heading at the start and, right beside it, the dog (`children`) standing
 * on the edge of what comes next, as if the heading were his line. The dog is in the flow, so the row is as tall as he
 * is and the heading, which sits on the row's bottom edge with a little padding, never runs under him. His box is
 * pulled onto the edge by the caller (`translate-y-[3%]`, so the soft feet of the cut-out disappear into it).
 */
export function SectionHead({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-5 sm:gap-8">
      <h2 id={id} className="pb-4 font-display text-h2 font-extrabold tracking-tight text-balance">
        {title}
      </h2>
      <div aria-hidden className="pointer-events-none mt-4 shrink-0">
        {children}
      </div>
    </div>
  );
}
