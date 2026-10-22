import { cn } from "cn";
import { CircleAlertIcon } from "lucide-react";

import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import type { ReviewedItem } from "~/orpc/checkout/contract";
import { getUnavailableVerdict, isPayable } from "~/routes/account_cart/cart-groups";
import { removeKey } from "~/routes/account_cart/hooks/use-cart-removal";

/*===== Cart Item Row =====*/
/**
 * One course for one dog, a line on its bag's packing slip: the title and the Latin name at the start, the price at the
 * end on a small chalk price tag (gold, never wrapped), and the quiet «برداشتن» under it. A row that can't be paid says
 * so in words where the price would be, and under it each of the server's reasons in red with an icon (never colour
 * alone) and its way out. A row whose dog isn't the customer's (`dog: null`) can only be removed: no reason, no way.
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
              <p dir="ltr" className="mt-0.5 text-end text-sm text-pretty text-muted-foreground">
                {item.course?.latinName ?? item.courseSlug}
              </p>
            </div>

            {/*------ Price and Remove ------*/}
            <div className="flex shrink-0 flex-col items-end gap-1">
              {payable ? (
                <PriceTag>{formatToman(item.price)}</PriceTag>
              ) : (
                <p className="pt-1.5 text-sm font-bold whitespace-nowrap text-muted-foreground">
                  فعلاً قابل پرداخت نیست
                </p>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-cart-remove={leaving ? undefined : removeKey(item)}
                aria-label={item.dog ? `برداشتن ${title} برای ${item.dog.name}` : `برداشتن مورد ${item.courseSlug}`}
                onClick={() => onRemove(item)}
                className="min-h-11 text-muted-foreground"
              >
                برداشتن
              </Button>
            </div>
          </div>

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

/*===== Price Tag =====*/
/**
 * The price on a small chalk tag (Course Detail's tag, smaller and unpinned): an outline stretched to the words by an SVG
 * (`non-scaling-stroke` keeps the ink even), its point and punched hole on the right, the reading start in RTL, so it
 * points at the course it prices. The amount is plain gold text, never wrapped.
 */
function PriceTag({ children }: { children: React.ReactNode }) {
  return (
    <p className="relative py-1.5 ps-8 pe-3 font-extrabold whitespace-nowrap text-primary tabular-nums">
      <svg
        aria-hidden
        viewBox="0 0 160 40"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible text-foreground/70"
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
        className="absolute top-1/2 right-3 size-2 -translate-y-1/2 rounded-full border-[1.5px] border-foreground/70 bg-sunken"
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
  return item.dog ? "این دوره دیگه وجود نداره" : "این مورد دیگه در دسترس نیست";
}
