import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { m } from "~/paraglide/messages";
import { CATALOGUE_COLUMN } from "~/routes/course_catalogue/layout";
import { DogCounter } from "~/routes/course_catalogue/components/dog-counter";

/*===== Catalogue Header =====*/
/**
 * The page's top: the headline, one line of help and the «خرید دوره» link, with the dog that counts the courses beside
 * them. The search is the site header's (`HeaderSearch`), so the line points up at it. The block has no bottom padding
 * on the dog's side and no overflow clipping of its own: the shelf that follows it is the wall the dog looks over.
 */
export function CatalogueHeader({
  total,
  query,
  familyLabel,
}: {
  total: number;
  query: string;
  familyLabel: string | null;
}) {
  return (
    <section
      aria-labelledby="catalogue-title"
      className={`${CATALOGUE_COLUMN} grid items-end pt-section-sm md:grid-cols-12 md:gap-x-8 lg:gap-x-10`}
    >
      {/*------ Words ------*/}
      <div className="pb-6 md:col-span-7 md:pb-12">
        <h1 id="catalogue-title" className={`${DISPLAY_HEADING} text-h1 text-balance`}>
          {m.course_catalogue_header_title()}
        </h1>
        <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">{m.course_catalogue_header_text()}</p>
        {/* For people who already know what they want: signed out they are sent to sign in and brought back. */}
        <Link to="/buy" className={buttonVariants({ size: "lg", className: "mt-7" })}>
          {m.course_catalogue_header_buy()}
        </Link>
      </div>

      {/*------ Dog ------*/}
      <div className="md:col-span-5">
        <DogCounter total={total} query={query} familyLabel={familyLabel} />
      </div>
    </section>
  );
}
