import { cn } from "cn";

import { ChalkBubble } from "~/components/chalk-bubble";
import type { MascotCutName } from "~/components/mascot-cut";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { formatNumber } from "~/lib/locale-format";
import type { ReviewedItem } from "~/orpc/checkout/contract";
import { m } from "~/paraglide/messages";
import { getGroupLine, type DogGroup } from "~/routes/account_cart/cart-groups";
import { PLATE } from "~/routes/account_cart/column";
import { CartItemRow } from "~/routes/account_cart/components/cart-item-row";
import { EdgeDog } from "~/routes/account_cart/components/edge-dog";
import { PlateHead } from "~/routes/account_cart/components/plate-head";
import { TapedPrint } from "~/routes/account_cart/components/taped-print";
import { useChanged } from "~/routes/account_cart/hooks/use-changed";
import { useFolding } from "~/routes/account_cart/hooks/use-folding";

/*===== The Center's Dog per Bag =====*/
/**
 * Who stands on each bag's top edge, in turn: packing the first bag beside the travel bag, the price tag by the
 * chalkboard on the second, back from the pet shop on the third. Widths at phone and `lg` (all well under 1.3x the
 * cut-outs' natural widths); `margin` keeps the scenery behind him inside the column.
 */
const EDGE_DOGS: {
  name: MascotCutName;
  width: string;
  scenery: { name: MascotCutName; width: string };
  margin: string;
}[] = [
  { name: "pack", width: "w-24 lg:w-[8.5rem]", scenery: { name: "suitcase", width: "78%" }, margin: "me-14 lg:me-20" },
  {
    name: "price-tag",
    width: "w-[4.6rem] lg:w-[6.5rem]",
    scenery: { name: "chalkboard", width: "112%" },
    margin: "me-16 lg:me-24",
  },
  {
    name: "shopping",
    width: "w-24 lg:w-[8.5rem]",
    scenery: { name: "petshop", width: "86%" },
    margin: "me-16 lg:me-24",
  },
];

/*===== Dog Bag =====*/
/**
 * One of the customer's dogs and the courses about to be bought for it: its bag. Its name in gold on the row above the
 * plate, with the center's dog on the plate's top edge at the end corner (he packs the bags). On the plate: the dog's
 * photo as a taped print with its own bubble from the print's corner (what it's about to start, or, when nothing in the
 * bag can be paid, why not), and the courses as lines on a packing slip.
 *
 * The mascot speaks only on the first bag, and only when something in it can be paid; on a bag where nothing can, its
 * own dog carries the reason and he stays quiet.
 *
 * Phones: the print and its bubble side by side, the slip under them. From `lg`: the print column at the start with the
 * bubble under the print, the slip beside it stretched to the column's height, its blank ruled lines filling what the
 * rows leave.
 *
 * Motion: the bag rises in after the ones before it (`--answer-delay`), its print drops, the edge dog rises on scroll.
 * A removed row folds away; a bag whose last row is removed folds away whole (`leaving`, from the page).
 */
export function DogBag({
  group,
  index,
  leaving = false,
  onRemove,
}: {
  group: DogGroup;
  /** The bag's place in the cart: picks the edge dog, the print's tilt and the arrival delay. */
  index: number;
  leaving?: boolean;
  onRemove: (item: ReviewedItem) => void;
}) {
  const { dog } = group;
  const titleId = `cart-dog-${dog.id}`;
  const edge = EDGE_DOGS[index % EDGE_DOGS.length]!;
  const rows = useFolding(group.items, (item) => `${item.courseSlug}|${item.dogId}`);

  const line = getGroupLine(group);
  const lineChanged = useChanged(line);
  const mascotSpeaks = index === 0 && group.payable.length > 0;
  const delay = `${Math.min(index, 3) * 0.12}s`;

  return (
    <section
      aria-labelledby={titleId}
      aria-hidden={leaving || undefined}
      inert={leaving}
      className={cn("grid grid-rows-[1fr]", leaving ? "ct-fold" : "answer-in")}
      style={{ "--answer-delay": delay } as React.CSSProperties}
    >
      <div className={cn("min-h-0", leaving && "overflow-hidden")}>
        {/*===== Name and the Center's Dog =====*/}
        {/* On a phone his bubble opens above him: the first bag leaves it room under the hero's path. */}
        <PlateHead
          className={cn(mascotSpeaks && "pt-14 lg:pt-0")}
          figureClassName={edge.margin}
          heading={
            <>
              <h2 id={titleId} className={cn(DISPLAY_HEADING, "text-3xl text-primary lg:text-4xl")}>
                <bdi>{dog.name}</bdi>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {group.items.length === 1
                  ? m.account_cart_bag_count_one({ count: formatNumber(group.items.length) })
                  : m.account_cart_bag_count_other({ count: formatNumber(group.items.length) })}
              </p>
            </>
          }
        >
          <EdgeDog name={edge.name} scenery={edge.scenery} className={edge.width}>
            {mascotSpeaks && (
              // Physical: over his head, opening towards the words; the tail (1.75rem in from the end nearest him, left
              // in Persian) aims down at him. The English figure is mirrored, so the bubble opens to the left there.
              <ChalkBubble
                tail="end"
                className="answer-pop absolute bottom-[96%] left-[30%] max-w-[11rem] text-pretty [--answer-delay:0.8s] [--pop-origin:1.75rem_100%] lg:max-w-[14rem] ltr:right-[30%] ltr:left-auto ltr:[--pop-origin:calc(100%-1.75rem)_100%]"
              >
                {m.account_cart_bag_bubble()}
              </ChalkBubble>
            )}
          </EdgeDog>
        </PlateHead>

        {/*===== Bag =====*/}
        <div className={cn(PLATE, "p-4 sm:p-6 lg:p-8")}>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-y-5 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-x-8">
            {/*------ Print and Its Bubble ------*/}
            <div className="flex items-center gap-4 lg:flex-col lg:items-stretch lg:gap-0 lg:self-start">
              <TapedPrint
                name={dog.name}
                photo={dog.photo}
                tilt={index % 2 ? "rotate-2" : "-rotate-2"}
                delay={`${Math.min(index, 3) * 0.12 + 0.15}s`}
              />
              {/* Phones: beside the print, the tail at its bottom right aimed at it. From `lg`: over the print's bottom
                  edge, the tail up into the photo. The dog's words are also said by the rows' plain text. */}
              <div aria-hidden className="min-w-0 lg:relative lg:z-10 lg:-ms-3 lg:-mt-5">
                <ChalkBubble
                  key={line}
                  tail="right"
                  className={cn(
                    "max-w-full text-pretty [--pop-origin:calc(100%-2.25rem)_100%] lg:hidden",
                    lineChanged && "answer-pop",
                  )}
                >
                  {line}
                </ChalkBubble>
                <ChalkBubble
                  key={`lg-${line}`}
                  tail="right"
                  tailEdge="top"
                  className={cn(
                    "hidden max-w-[12rem] text-pretty [--pop-origin:calc(100%-2.25rem)_0] lg:block",
                    lineChanged && "answer-pop",
                  )}
                >
                  {line}
                </ChalkBubble>
              </div>
            </div>

            {/*------ Packing Slip ------*/}
            {/* Blank ruled lines under the rows (the slip's own background, the rows paint over it), so a short list
                beside the print reads as a list with room left, not a hole. */}
            <div className="flex flex-col rounded-2xl border border-foreground/10 bg-card paper-grain px-4 sm:px-5">
              <ul className="divide-y divide-dashed divide-foreground/20 border-dashed border-foreground/20 lg:border-b">
                {rows.map((row) => (
                  <CartItemRow key={row.key} item={row.item} leaving={row.leaving} onRemove={onRemove} />
                ))}
              </ul>
              <div
                aria-hidden
                className="hidden min-h-0 flex-1 bg-[repeating-linear-gradient(to_bottom,transparent_0_calc(3.25rem-1px),rgb(244_238_226/0.07)_calc(3.25rem-1px)_3.25rem)] lg:block"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
