import { cn } from "cn";
import { CheckIcon, ShoppingCartIcon } from "lucide-react";

import { ChalkDoodle } from "~/components/chalk-doodle";
import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { CART_PATH } from "~/orpc/checkout/constants";
import type { Course } from "~/orpc/course/contract";
import { DogRowList } from "~/routes/course_detail/components/dog-row-list";
import type { BuyCardState } from "~/routes/course_detail/components/use-buy-card";

/*===== Buy Card =====*/
/**
 * The page's one idea: a conversation with your dog. The price, the customer's dogs with a verdict each, the picked
 * dog's bubble, and the one gold button. Every state of the viewer (signed out, no dogs, no price, a dog that can't
 * buy yet) is the same card with different words, so the page never jumps.
 *
 * On desktop the course photo is the card's top half and fades into its surface. Phones show that photo above the title
 * instead (in the hero), so the card starts at the price.
 */
export function BuyCard({
  course,
  buy,
  cardRef,
}: {
  course: Course;
  buy: BuyCardState;
  /** Watched by the phone action bar, which steps aside while the card is on screen. */
  cardRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className="relative">
      <div
        ref={cardRef}
        id="buy-card"
        className="relative scroll-mt-24 overflow-hidden rounded-4xl border border-border bg-card shadow-sm"
      >
        {/*------ Photo ------*/}
        <div className="relative max-lg:hidden">
          <img
            src={course.cover.src}
            alt={course.cover.alt}
            width={course.cover.width}
            height={course.cover.height}
            fetchPriority="high"
            className="aspect-[16/8] w-full object-cover"
          />
          {/* Fades from the card's own surface, so the photo has no bottom edge. */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-card to-transparent" />
        </div>

        <div className="relative flex flex-col gap-5 p-5 sm:p-7 lg:-mt-6">
          {/*------ Price ------*/}
          <Price price={course.price} />

          {/*------ What the Viewer Needs to Do ------*/}
          <Body course={course} buy={buy} />

          {/*------ Action ------*/}
          <div className="flex flex-col gap-3">
            <BuyButton buy={buy} className="w-full" />
            {buy.quieter && (
              <Link
                to={buy.quieter.to}
                className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}
              >
                {buy.quieter.label}
              </Link>
            )}

            {/* Always mounted: a live region has to exist before its text changes to be announced. The full-cart
                message is for everyone, so it is visible; «added» only repeats what the button now says. */}
            <output className={cn("block", buy.message === "full" ? "text-sm text-pretty text-foreground" : "sr-only")}>
              {buy.message === "added" && "به سبد اضافه شد"}
              {buy.message === "full" && "سبد پر است. اول یکی از موردهای آن را بردار."}
            </output>
          </div>

          {buy.mode !== "evaluation" && (
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
              بعد از پرداخت، {HEAD_TRAINER.firstName} زنگ می‌زنه و با هم هماهنگ می‌کنیم.
              <Link
                to="/help#how-buying-works"
                className="mt-1 block w-fit rounded-sm font-bold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                خرید چطوری کار می‌کنه؟
              </Link>
            </p>
          )}
        </div>
      </div>

      {/*------ Doodle ------*/}
      {/* Outside the clipped card, at its start edge, curling in toward the dog list. Desktop only: on a phone the
          list has no free margin. */}
      {buy.mode === "dogs" && (
        <ChalkDoodle name="arrow-curl" className="absolute -start-16 top-72 w-12 -rotate-12 opacity-80 max-lg:hidden" />
      )}
    </div>
  );
}

/*===== Price =====*/
function Price({ price }: { price: number | null }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-3">
      <span className="text-sm text-muted-foreground">هزینه‌ی دوره</span>
      <span className="text-3xl font-black text-primary">{price === null ? "بعد از ارزیابی" : formatToman(price)}</span>
    </p>
  );
}

/*===== Body =====*/
/** The words and the dog list between the price and the button, by the viewer's state. */
function Body({ course, buy }: { course: Course; buy: BuyCardState }) {
  switch (buy.mode) {
    case "evaluation":
      return course.price === null ? (
        <p className="text-pretty text-muted-foreground">
          اول {HEAD_TRAINER.firstName} سگت را می‌بیند. ارزیابی رایگان است.
        </p>
      ) : null;
    case "visitor":
      return (
        <p className="text-pretty text-muted-foreground">
          برای دیدن اینکه کدام سگت می‌تونه این دوره رو بگذرونه، وارد شو.
        </p>
      );
    case "no-dogs":
      return (
        <p className="text-pretty text-muted-foreground">
          اول سگت را معرفی کن، بعد می‌بینیم کدام دوره‌ها برایش باز است.
        </p>
      );
    case "dogs":
      return <DogRowList dogs={buy.dogs} pickedId={buy.pickedId} verdict={buy.verdict} onPick={buy.pick} />;
  }
}

/*===== Buy Button =====*/
/**
 * The one main button for the current state. The card and the phone bar both draw it from the same state, so they
 * always agree. A button that can't be used yet says why in its own label; it isn't hidden.
 */
export function BuyButton({
  buy,
  className,
  size = "lg",
}: {
  buy: BuyCardState;
  className?: string;
  size?: "lg" | "default";
}) {
  const { action } = buy;

  switch (action.kind) {
    case "link":
      return (
        <Link to={action.to} className={buttonVariants({ variant: "solid", size, className })}>
          {action.label}
        </Link>
      );
    case "pick":
      return (
        <Button type="button" variant="solid" size={size} disabled className={className}>
          اول یکی از سگ‌ها را انتخاب کن
        </Button>
      );
    case "blocked":
      return (
        <Button type="button" variant="solid" size={size} disabled className={className}>
          افزودن به سبد
        </Button>
      );
    case "add":
      return (
        <Button type="button" variant="solid" size={size} onClick={buy.add} className={className}>
          <ShoppingCartIcon aria-hidden />
          افزودن به سبد
        </Button>
      );
    case "in-cart":
      return (
        <span className={cn("flex flex-col items-center gap-2", className)}>
          {/* Not a button: there is nothing to press. The state is the words. */}
          <span
            className={buttonVariants({
              variant: "outline",
              size,
              className: "w-full border-primary/60 text-primary hover:bg-card hover:text-primary",
            })}
          >
            <CheckIcon aria-hidden strokeWidth={2.6} />
            در سبد است
          </span>
          <Link
            to={CART_PATH}
            className="rounded-sm text-sm font-bold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            دیدن سبد
          </Link>
        </span>
      );
  }
}
