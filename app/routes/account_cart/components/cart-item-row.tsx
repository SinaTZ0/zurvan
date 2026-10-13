import { cn } from "cn";

import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import type { ReviewedItem } from "~/orpc/checkout/contract";
import { getUnavailableVerdict, isPayable } from "~/routes/account_cart/cart-groups";
import { removeKey } from "~/routes/account_cart/hooks/use-cart-removal";

/*===== Cart Item Row =====*/
/**
 * One course for one dog, on `sunken`. A row that can't be paid says so in words (never colour alone), gives the
 * server's reason and the way out of it, and stays removable. A row whose dog isn't the customer's (`dog: null`) can
 * only be removed, so it gives no reason or way.
 */
export function CartItemRow({ item, onRemove }: { item: ReviewedItem; onRemove: (item: ReviewedItem) => void }) {
  const payable = isPayable(item);
  const title = getRowTitle(item);
  const verdict = !payable && item.dog !== null ? getUnavailableVerdict(item) : null;

  return (
    <li className="rounded-2xl bg-sunken p-4">
      <div className="flex items-start justify-between gap-x-4 gap-y-2">
        {/*------ Course ------*/}
        <div className="min-w-0">
          <h3 className={cn("font-bold text-pretty", !payable && "text-muted-foreground")}>{title}</h3>
          <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
            {item.course ? (
              <span dir="ltr" className="inline-block">
                {item.course.latinName}
              </span>
            ) : (
              <span dir="ltr" className="inline-block">
                {item.courseSlug}
              </span>
            )}
          </p>
        </div>

        {/*------ Price and Remove ------*/}
        <div className="flex shrink-0 flex-col items-end gap-1">
          {payable ? (
            <p className="font-extrabold whitespace-nowrap text-primary">{formatToman(item.price)}</p>
          ) : (
            <p className="text-sm font-bold whitespace-nowrap text-muted-foreground">قابل پرداخت نیست</p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-cart-remove={removeKey(item)}
            aria-label={item.dog ? `برداشتن ${title} برای ${item.dog.name}` : `برداشتن مورد ${item.courseSlug}`}
            onClick={() => onRemove(item)}
            className="min-h-11 text-muted-foreground"
          >
            برداشتن
          </Button>
        </div>
      </div>

      {/*------ Reason ------*/}
      {verdict && (
        <ul className="mt-2 flex flex-col gap-2 border-s-2 border-border ps-3 text-sm text-muted-foreground">
          {verdict.problems.map((problem) => (
            <li key={problem.message} className="text-pretty">
              {problem.message}
              {problem.way && (
                <>
                  {" "}
                  <Link
                    to={problem.way.to}
                    className="rounded-sm font-bold whitespace-nowrap text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {problem.way.label}
                  </Link>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
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
  return item.dog ? "این دوره دیگر وجود ندارد" : "این مورد دیگر در دسترس نیست";
}
