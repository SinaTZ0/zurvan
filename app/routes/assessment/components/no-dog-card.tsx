import { cn } from "cn";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";

/*===== No Dog Card =====*/
/**
 * Stands where the form would be when there is nothing to ask for: no dog in the account yet, or every dog already
 * has a request waiting or was evaluated. One gold button says where to go; the dog beside it says why.
 */
export function NoDogCard({
  title,
  detail,
  action,
  extraLink,
}: {
  title: string;
  detail: string;
  action: { to: string; label: string };
  /** A quieter second way on, as a text link. */
  extraLink?: { to: string; label: string };
}) {
  return (
    <section
      aria-labelledby="no-dog-title"
      className="rounded-4xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:p-10"
    >
      <h2 id="no-dog-title" className="text-2xl font-extrabold text-balance">
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">{detail}</p>

      <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <Link to={action.to} className={cn(buttonVariants({ size: "lg" }), "sm:min-w-52")}>
          {action.label}
        </Link>
        {extraLink && (
          <Link
            to={extraLink.to}
            className="self-center rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:self-auto"
          >
            {extraLink.label}
          </Link>
        )}
      </div>
    </section>
  );
}
