import { MascotCut } from "~/components/mascot-cut";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import type { ReviewedItem } from "~/orpc/checkout/contract";
import { m } from "~/paraglide/messages";
import { PLATE } from "~/routes/account_cart/column";
import { CartItemRow } from "~/routes/account_cart/components/cart-item-row";
import { useFolding } from "~/routes/account_cart/hooks/use-folding";

/*===== Orphan Plate =====*/
/**
 * The items the server couldn't match to one of this customer's dogs and a course (a dog of another account on the
 * same browser, a removed course, a hand-edited cart): no photo, no bubble, nothing but «برداشتن». `checkout.review`
 * nulls both `course` and `dog` for either cause, so the heading names neither. No dog stands on its edge: the small
 * `sniff` dog noses beside the heading, the scent gone cold.
 */
export function OrphanPlate({
  items,
  leaving = false,
  onRemove,
}: {
  items: readonly ReviewedItem[];
  leaving?: boolean;
  onRemove: (item: ReviewedItem) => void;
}) {
  const rows = useFolding(items, (item) => `${item.courseSlug}|${item.dogId}`);

  return (
    <section
      aria-labelledby="cart-orphans-title"
      aria-hidden={leaving || undefined}
      inert={leaving}
      className={leaving ? "ct-fold grid grid-rows-[1fr]" : "answer-in grid grid-rows-[1fr]"}
    >
      <div className={leaving ? "min-h-0 overflow-hidden" : "min-h-0"}>
        <div className={`${PLATE} p-4 sm:p-6 lg:p-8`}>
          {/*------ Heading ------*/}
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 id="cart-orphans-title" className={`${DISPLAY_HEADING} text-2xl text-balance`}>
                {m.account_cart_orphan_title()}
              </h2>
              <p className="mt-1.5 max-w-md text-sm text-pretty text-muted-foreground">
                {m.account_cart_orphan_line()}
              </p>
            </div>
            {/* Physical sides: he noses rightwards, a bush in front of him, a pool of warm light under him. */}
            <div aria-hidden className="relative w-24 shrink-0 sm:w-32">
              <div className="absolute -inset-x-1/3 -inset-y-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_70%,rgb(255_194_26/0.08),transparent)]" />
              <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[88%] w-[30%] translate-y-[6%]" />
              <MascotCut name="sniff" className="lively-breathe relative block w-full" />
            </div>
          </div>

          {/*------ Rows ------*/}
          <ul className="mt-4 divide-y divide-dashed divide-foreground/20 rounded-2xl border border-foreground/10 bg-card paper-grain px-4 sm:px-5">
            {rows.map((row) => (
              <CartItemRow key={row.key} item={row.item} leaving={row.leaving} onRemove={onRemove} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
