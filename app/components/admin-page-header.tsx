import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Admin Page Header =====*/
/**
 * The top of every Admin page: its one `h1` in Estedad, a summary line that says what needs him right now, and room for
 * an action at the end. The site's heading face without its story: no eyebrow, no greeting, since the Admin comes here
 * to work.
 */
export function AdminPageHeader({
  title,
  summary,
  children,
}: {
  title: string;
  /** One line under the title, e.g. «۳ درخواست منتظر جوابه». */
  summary?: React.ReactNode;
  /** An action at the end of the header, if the page has one. */
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 lg:mb-8">
      <div className="min-w-0">
        <h1 className={cn(DISPLAY_HEADING, "text-3xl text-balance lg:text-4xl")}>{title}</h1>
        {summary && <p className="mt-2 text-sm text-pretty text-muted-foreground">{summary}</p>}
      </div>
      {children}
    </header>
  );
}
