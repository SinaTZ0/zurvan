import { cn } from "cn";
import { useSetAtom } from "jotai";
import { CheckIcon, CircleAlertIcon, MapPinIcon } from "lucide-react";

import { setCartItemPlaceAtom } from "~/atoms/cart";
import { BoardingCostNote } from "~/components/boarding-cost-note";
import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { formatToman, latinNameAddsToTitle } from "~/lib/course-format";
import type { ReviewedItem } from "~/orpc/checkout/contract";
import { COURSE_PLACE_LABELS } from "~/orpc/course/constants";
import { m } from "~/paraglide/messages";
import { getUnavailableVerdict, isPayable, needsPlace } from "~/routes/account_cart/cart-groups";
import { removeKey } from "~/routes/account_cart/hooks/use-cart-removal";

/*===== Cart Item Row =====*/
/**
 * One course for one dog, a line on its bag's packing slip: the title and the Latin name at the start, the price at the
 * end on a small chalk price tag (gold, never wrapped), and the quiet «برداشتن» under it. A row that can't be paid says
 * so in words where the price would be, and under it each of the server's reasons in red with an icon (never colour
 * alone) and its way out. A row whose dog isn't the customer's (`dog: null`) can only be removed: no reason, no way.
 *
 * A payable row whose course offers places asks where it is taught (`PlacePicker`); boarding brings the note that its
 * cost is extra and agreed on the phone, right under the price.
 *
 * `leaving` is the copy of a row that was just removed, folding away (`useFolding`): inert, hidden from assistive tech
 * and without `data-cart-remove`, so focus never lands on it.
 */
export function CartItemRow({
  item,
  leaving = false,
  onRemove,
}: {
  item: ReviewedItem;
  leaving?: boolean;
  onRemove: (item: ReviewedItem) => void;
}) {
  const payable = isPayable(item);
  const title = getRowTitle(item);
  const verdict = !payable && item.dog !== null ? getUnavailableVerdict(item) : null;

  return (
    <li aria-hidden={leaving || undefined} inert={leaving} className={cn("grid grid-rows-[1fr]", leaving && "ct-fold")}>
      <div className="min-h-0 overflow-hidden">
        <div className="py-4">
          <div className="flex items-start justify-between gap-x-4">
            {/*------ Course ------*/}
            <div className="min-w-0 pt-1">
              <h3 className={cn("font-bold text-pretty", !payable && "text-muted-foreground")}>{title}</h3>
              {/* `w-fit` sits the Latin name at the reading start (the title's side) in either language; inside its own
                  LTR box `text-end` would push it right on the English page too. */}
              {latinNameAddsToTitle({ title, latinName: item.course?.latinName ?? item.courseSlug }) && (
                <p dir="ltr" className="mt-0.5 w-fit text-sm text-pretty text-muted-foreground">
                  {item.course?.latinName ?? item.courseSlug}
                </p>
              )}
            </div>

            {/*------ Price and Remove ------*/}
            <div className="flex shrink-0 flex-col items-end gap-1">
              {payable ? (
                <PriceTag>{formatToman(item.price)}</PriceTag>
              ) : (
                <p className="pt-1.5 text-sm font-bold whitespace-nowrap text-muted-foreground">
                  {m.account_cart_row_unavailable()}
                </p>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-cart-remove={leaving ? undefined : removeKey(item)}
                aria-label={
                  item.dog
                    ? m.account_cart_row_remove_aria({ title, dog: item.dog.name })
                    : m.account_cart_row_remove_orphan_aria({ slug: item.courseSlug })
                }
                onClick={() => onRemove(item)}
                className="min-h-11 text-muted-foreground"
              >
                {m.account_cart_row_remove()}
              </Button>
            </div>
          </div>

          {/*------ Place ------*/}
          {payable && item.places.length > 0 && <PlacePicker item={item} disabled={leaving} />}

          {/*------ Reasons ------*/}
          {verdict && (
            <ul className="mt-1 flex flex-col gap-2 text-sm text-destructive">
              {verdict.problems.map((problem) => (
                <li key={problem.message} className="flex items-start gap-2 text-pretty">
                  <CircleAlertIcon aria-hidden strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {problem.message}
                    {problem.way && (
                      <>
                        {" "}
                        <Link
                          {...problem.way.link}
                          className="rounded-sm font-bold whitespace-nowrap underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {problem.way.label}
                        </Link>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

/*===== Place Picker =====*/
/**
 * Where the course is taught (F5): one chip per place the course offers, the recommended one tagged, as native radios
 * (arrow keys and screen readers work as usual; picked is told by the gold border and the tick, not colour alone). A
 * course with one place just says it. Picking is saved with the cart at once (`setCartItemPlaceAtom`); «پرداخت» waits
 * while a row has no place, and the legend turns gold so the row that holds it up is easy to find.
 */
function PlacePicker({ item, disabled }: { item: ReviewedItem; disabled: boolean }) {
  const setPlace = useSetAtom(setCartItemPlaceAtom);
  const [only] = item.places;

  return (
    <div className="mt-2 flex flex-col gap-3">
      {item.places.length === 1 && only ? (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPinIcon aria-hidden strokeWidth={2} className="size-4 shrink-0 text-primary" />
          {m.account_cart_place_one({ place: COURSE_PLACE_LABELS[only] })}
        </p>
      ) : (
        <fieldset className="min-w-0" disabled={disabled}>
          <legend
            className={cn("mb-2 flex items-center gap-1.5 text-sm font-bold", needsPlace(item) && "text-primary")}
          >
            <MapPinIcon aria-hidden strokeWidth={2} className="size-4 shrink-0 text-primary" />
            {m.account_cart_place_legend()}
          </legend>
          <div className="flex flex-wrap gap-2">
            {item.places.map((place) => (
              <label key={place} className="relative">
                <input
                  type="radio"
                  name={`cart-place-${item.dogId}-${item.courseSlug}`}
                  value={place}
                  checked={item.place === place}
                  onChange={() => setPlace({ item, place })}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex h-11 cursor-pointer items-center gap-1.5 rounded-full border border-foreground/20 bg-card px-4 text-sm font-bold text-muted-foreground select-none",
                    "peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-foreground",
                    "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:border-primary/50 hover:text-foreground",
                    "transition-colors motion-safe:transition-[translate,border-color,background-color,color] motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0",
                  )}
                >
                  {item.place === place && (
                    <CheckIcon
                      aria-hidden
                      className="answer-pop size-4 text-primary [--pop-origin:50%_50%]"
                      strokeWidth={3}
                    />
                  )}
                  {COURSE_PLACE_LABELS[place]}
                  {place === item.recommendedPlace && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] leading-none font-bold text-primary">
                      {m.shared_place_recommended()}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {item.place === "boarding" && <BoardingCostNote />}
    </div>
  );
}

/*===== Price Tag =====*/
/**
 * The price on a small chalk tag (Course Detail's tag, smaller and unpinned): an outline stretched to the words by an SVG
 * (`non-scaling-stroke` keeps the ink even), its point and punched hole at the reading start (right in Persian; the
 * outline is mirrored and the hole moved with `ltr:` and `start-` on the English page), so it points at the course it
 * prices. The amount is plain gold text, never wrapped.
 */
function PriceTag({ children }: { children: React.ReactNode }) {
  return (
    <p className="relative py-1.5 ps-8 pe-3 font-extrabold whitespace-nowrap text-primary tabular-nums">
      <svg
        aria-hidden
        viewBox="0 0 160 40"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible text-foreground/70 ltr:-scale-x-100"
      >
        <path
          d="M6 1.5H140L158.5 20L140 38.5H6Q1.5 38.5 1.5 34V6Q1.5 1.5 6 1.5Z"
          fill="var(--background)"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        aria-hidden
        className="absolute start-3 top-1/2 size-2 -translate-y-1/2 rounded-full border-[1.5px] border-foreground/70 bg-sunken"
      />
      <span className="relative">{children}</span>
    </p>
  );
}

/*===== Row Title =====*/
/**
 * The course's title, or the honest fallback. `checkout.review` nulls both `course` and `dog` when either is missing,
 * so a row without a dog can't tell «the course is gone» from «the dog is someone else's»: it says neither. The
 * course-gone line is for a row that still has its dog.
 */
function getRowTitle(item: ReviewedItem) {
  if (item.course) return item.course.title;
  return item.dog ? m.account_cart_row_title_gone() : m.account_cart_row_title_unavailable();
}
