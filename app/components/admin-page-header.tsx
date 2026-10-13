/*===== Admin Page Header =====*/
/**
 * The top of every Admin page: its one `h1`, a summary line that says what needs him right now, and room for an action
 * at the end. Calmer than the storefront's section titles: the Admin comes here to work, not to be greeted.
 */
export function AdminPageHeader({
  title,
  summary,
  children,
}: {
  title: string;
  /** One line under the title, e.g. «۳ درخواست منتظر جواب است». */
  summary?: React.ReactNode;
  /** An action at the end of the header, if the page has one. */
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 lg:mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold text-balance lg:text-3xl">{title}</h1>
        {summary && <p className="mt-1 text-sm text-pretty text-muted-foreground">{summary}</p>}
      </div>
      {children}
    </header>
  );
}
