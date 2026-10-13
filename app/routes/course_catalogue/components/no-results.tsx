import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";

/*===== No Results =====*/
/**
 * Replaces the grid when nothing matches. The gold button is a plain link to `/courses`, which drops both the search
 * and the family; the free evaluation is the quieter way out.
 */
export function NoResults() {
  return (
    <section
      aria-labelledby="no-results-title"
      className="rounded-4xl border border-border bg-card px-6 py-10 shadow-sm sm:px-10 lg:px-14 lg:py-14"
    >
      <h2 id="no-results-title" className="text-2xl font-extrabold text-balance">
        چیزی پیدا نشد
      </h2>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">با اسم دیگه‌ای بگرد یا همه‌ی دوره‌ها رو ببین.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/courses" className={buttonVariants({ variant: "solid", size: "lg", className: "sm:min-w-44" })}>
          همه‌ی دوره‌ها
        </Link>
        <Link to="/assessment" className={buttonVariants({ variant: "outline", size: "lg", className: "sm:min-w-44" })}>
          ارزیابی رایگان بگیر
        </Link>
      </div>
    </section>
  );
}
