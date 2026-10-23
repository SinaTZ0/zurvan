import { cn } from "cn";
import { useAtomValue, useSetAtom } from "jotai";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { addCartItemAtom, cartItemsAtom, isInCart } from "~/atoms/cart";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { useHydrated } from "~/hooks/use-hydrated";
import { describeSessions, latinNameAddsToTitle } from "~/lib/course-format";
import type { Course } from "~/orpc/course/contract";
import { PriceTag } from "~/routes/buy/components/price-tag";
import { m } from "~/paraglide/messages";

/*===== Course Buy Card =====*/
/**
 * A course the picked dog can take now: the cover photo, the title (to the course's page), its Latin name, how many
 * sessions, the price on a chalk tag and one button that puts it in the cart (F5). The server already said this dog
 * can buy it; the cart and «پرداخت» check again.
 *
 * The button is one element in both states, so the change is a motion and not a swap: gold «افزودن به سبد» with a plus
 * turns into the gold-outlined «در سبد است» with a check (both icons share one grid cell and turn into each other), and
 * the price tag swings. «در سبد است» can't be pressed (`aria-disabled`); the cart bar is the way on. The cart is
 * browser-first, so «در سبد است» shows only after hydration. A full cart is said in a toast, as before.
 *
 * Phones: the cover is a 6rem thumb at the start beside the words, and the tag and the button share the last row (the
 * button takes the whole row when they don't fit side by side). `wide` lays a lone last card across both columns of
 * the grid (from `sm`), the cover at its start, so the grid never ends on an empty cell.
 */
export function CourseBuyCard({
  course,
  price,
  dogId,
  wide = false,
}: {
  course: Course;
  price: number;
  dogId: string;
  wide?: boolean;
}) {
  const hydrated = useHydrated();
  const items = useAtomValue(cartItemsAtom);
  const addToCart = useSetAtom(addCartItemAtom);
  const [added, setAdded] = useState<number | null>(null);
  const inCart = hydrated && isInCart(items, { courseSlug: course.slug, dogId });

  function add() {
    if (inCart) return;
    const result = addToCart({ courseSlug: course.slug, dogId });
    if (result === "full") toast.add({ title: m.buy_card_cart_full(), type: "error" });
    if (result === "added") setAdded((count) => (count ?? 0) + 1);
  }

  const icon = "transition duration-300 ease-out motion-reduce:transition-none";

  return (
    <article
      className={cn(
        "group/card grid h-full grid-cols-[6rem_minmax(0,1fr)] content-start gap-x-4 overflow-hidden rounded-3xl border border-foreground/15 bg-card paper-grain p-3.5 shadow-sm sm:flex sm:flex-col sm:p-0",
        wide && "sm:grid sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] sm:grid-rows-[auto_1fr] sm:gap-x-0",
      )}
    >
      {/*===== Cover =====*/}
      <div
        className={cn(
          "aspect-square overflow-hidden rounded-2xl sm:aspect-[16/9] sm:rounded-none",
          // Wide, the photo fills its column without setting the row's height: the words do.
          wide && "sm:relative sm:row-span-2 sm:aspect-auto sm:h-full",
        )}
      >
        <img
          src={course.cover.src}
          alt={course.cover.alt}
          width={course.cover.width}
          height={course.cover.height}
          loading="lazy"
          decoding="async"
          className={cn(
            "size-full object-cover transition-transform duration-700 motion-safe:group-hover/card:scale-[1.03]",
            wide && "sm:absolute sm:inset-0",
          )}
        />
      </div>

      {/*===== Words =====*/}
      <div className="min-w-0 self-center sm:self-auto sm:px-5 sm:pt-5 lg:px-6 lg:pt-6">
        <h3 className="font-extrabold text-pretty sm:text-lg">
          <Link
            to="/courses/$slug"
            params={{ slug: course.slug }}
            className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {course.title}
          </Link>
        </h3>
        {latinNameAddsToTitle(course) && (
          <p dir="ltr" className="mt-0.5 w-fit text-sm text-muted-foreground">
            {course.latinName}
          </p>
        )}
        <p className="mt-1.5 text-sm text-muted-foreground">{describeSessions(course)}</p>
      </div>

      {/*===== Price and Button =====*/}
      {/* Under the thumb and the words on phones (both columns); at the card's foot from `sm`. */}
      <div
        className={cn(
          "col-span-2 mt-3 flex flex-wrap items-center justify-between gap-3 sm:mt-auto sm:px-5 sm:pt-5 sm:pb-5 lg:px-6 lg:pb-6",
          wide && "sm:col-span-1 sm:col-start-2 sm:self-end",
        )}
      >
        <PriceTag price={price} swingKey={added} className="ms-1" />
        <button
          type="button"
          onClick={add}
          aria-disabled={inCart || undefined}
          className={buttonVariants({
            variant: inCart ? "outline" : "solid",
            className: cn(
              "grow transition-colors duration-300 sm:grow-0",
              inCart &&
                "cursor-default border-primary/60 bg-transparent text-primary hover:bg-transparent hover:text-primary",
            ),
          })}
        >
          <span aria-hidden className="grid *:col-start-1 *:row-start-1">
            <PlusIcon className={cn(icon, inCart && "scale-50 rotate-90 opacity-0")} />
            <CheckIcon strokeWidth={2.6} className={cn(icon, !inCart && "scale-50 -rotate-90 opacity-0")} />
          </span>
          {inCart ? m.buy_card_in_cart() : m.buy_card_add()}
        </button>

        {/* Always mounted: a live region has to exist before its text changes to be announced. */}
        <output className="sr-only">{added !== null && inCart ? m.buy_card_added({ title: course.title }) : ""}</output>
      </div>
    </article>
  );
}
