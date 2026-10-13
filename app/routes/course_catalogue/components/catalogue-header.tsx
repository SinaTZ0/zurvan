import { DogCounter } from "~/routes/course_catalogue/components/dog-counter";

/*===== Catalogue Header =====*/
/**
 * The page's top: the headline, one line of help and the search (passed in as `children`), with the dog that counts the
 * courses beside them. The block has no bottom padding on the dog's side and no overflow clipping of its own: the shelf
 * that follows it is what the dog stands behind.
 */
export function CatalogueHeader({
  total,
  query,
  familyLabel,
  children,
}: {
  total: number;
  query: string;
  familyLabel: string | null;
  /** The search field. */
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby="catalogue-title"
      className="site-container grid items-end pt-section-sm md:grid-cols-12 md:gap-x-8 lg:gap-x-10"
    >
      {/*------ Words and Search ------*/}
      <div className="pb-8 md:col-span-7 md:pb-12">
        <h1 id="catalogue-title" className="font-display text-h1 font-black text-balance">
          همه‌ی چیزهایی که می‌تونم یاد بگیرم
        </h1>
        <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">
          هر دوره بعد از دوره‌ی قبلش باز می‌شه. اسم دوره رو بنویس یا از نوع‌ها انتخاب کن.
        </p>
        <div className="mt-8 max-w-xl">{children}</div>
      </div>

      {/*------ Dog ------*/}
      <div className="md:col-span-5">
        <DogCounter total={total} query={query} familyLabel={familyLabel} />
      </div>
    </section>
  );
}
