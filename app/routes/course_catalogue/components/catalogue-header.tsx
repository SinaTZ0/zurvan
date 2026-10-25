import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { m } from "~/paraglide/messages";
import { CATALOGUE_COLUMN } from "~/routes/course_catalogue/layout";
import { DogCounter } from "~/routes/course_catalogue/components/dog-counter";

/*===== Catalogue Header =====*/
/**
 * The page's top, kept short on phones so the courses start on the first screen: the headline, one line of help and the «خرید دوره» link, with the dog that counts the courses beside
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
      className={`${CATALOGUE_COLUMN} grid items-end pt-6 md:grid-cols-12 md:gap-x-8 md:pt-section-sm lg:gap-x-10`}
    >
      {/*------ Words ------*/}
      <div className="pb-4 md:col-span-7 md:pb-12">
        <h1 id="catalogue-title" className={`${DISPLAY_HEADING} text-[1.625rem] text-balance md:text-h1`}>
          {m.course_catalogue_header_title()}
        </h1>
        <p className="mt-2 max-w-md text-sm leading-7 text-pretty text-muted-foreground md:mt-4 md:text-lead">
          {m.course_catalogue_header_text()}
        </p>
        {/* For people who already know what they want: signed out they are sent to sign in and brought back. */}
        <Link to="/buy" className={buttonVariants({ className: "mt-4 md:mt-7 md:h-14 md:px-6 md:text-base" })}>
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
