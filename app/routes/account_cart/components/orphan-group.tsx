import type { ReviewedItem } from "~/orpc/checkout/contract";
import { CartItemRow } from "~/routes/account_cart/components/cart-item-row";

/*===== Orphan Group =====*/
/**
 * The items the server couldn't match to one of this customer's dogs and a course (a dog of another account on the
 * same browser, a removed course, a hand-edited cart): no photo, no bubble, and nothing but «برداشتن». `checkout.review`
 * nulls both `course` and `dog` for either cause, so the header names neither.
 */
export function OrphanGroup({
  items,
  onRemove,
}: {
  items: readonly ReviewedItem[];
  onRemove: (item: ReviewedItem) => void;
}) {
  return (
    <article
      aria-labelledby="cart-orphans-title"
      className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:p-6"
    >
      <h2 id="cart-orphans-title" className="text-lg font-extrabold text-balance">
        این موردها دیگر در دسترس نیستند
      </h2>
      <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
        دوره‌شان برداشته شده یا سگشان توی این حساب نیست. فقط می‌شه از سبد پاکشان کرد.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <CartItemRow key={`${item.courseSlug}|${item.dogId}`} item={item} onRemove={onRemove} />
        ))}
      </ul>
    </article>
  );
}
