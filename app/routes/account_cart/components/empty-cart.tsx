import { ChalkBubble } from "~/components/chalk-bubble";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { buttonVariants } from "~/components/ui/button";
import { m } from "~/paraglide/messages";
import { StagePlate } from "~/routes/account_cart/components/stage-plate";

/*===== Empty Cart =====*/
/**
 * Nothing in the cart (or every item was just removed): the center's dog noses into an empty shop cart on the path,
 * a bush either side. The words say where to start: a course's page, or the purchase page that starts from the dog.
 */
export function EmptyCart() {
  return (
    <StagePlate
      titleId="cart-empty-title"
      title={m.account_cart_empty_title()}
      stage={
        // Physical sides: he faces right, his nose in the cart in front of him.
        <div className="absolute bottom-[0.9rem] left-1/2 w-[17rem] -translate-x-1/2 lg:bottom-[1.2rem] lg:w-[24rem]">
          <MascotCut
            name="plants"
            className="lively-sway-2 absolute right-[90%] bottom-0 w-[18%] translate-y-[6%] -scale-x-100"
          />
          <MascotCut name="shop-cart" className="absolute -right-[4%] bottom-0 w-[46%] translate-y-[4%]" />
          <MascotCut name="plants" className="lively-sway absolute -right-[16%] bottom-0 w-[16%] translate-y-[6%]" />
          <div className="relative w-[60%] translate-y-[3%]">
            <div className="lively-pet">
              <MascotCut name="sniff" className="lively-breathe block w-full" />
            </div>
          </div>
          <ChalkBubble
            tail="right"
            className="answer-pop absolute right-[calc(47%-2.25rem)] bottom-[calc(100%+0.5rem)] max-w-[12rem] text-pretty [--answer-delay:0.5s] [--pop-origin:calc(100%-2.25rem)_100%] lg:max-w-[18rem]"
          >
            {m.account_cart_empty_bubble()}
          </ChalkBubble>
        </div>
      }
    >
      <p className="mt-3 max-w-lg text-lead text-pretty text-muted-foreground">{m.account_cart_empty_line()}</p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link to="/courses" className={buttonVariants({ variant: "solid", size: "lg", className: "sm:min-w-48" })}>
          {m.account_cart_empty_courses()}
        </Link>
        <Link to="/buy" className={buttonVariants({ variant: "outline", size: "lg" })}>
          {m.account_cart_empty_buy()}
        </Link>
      </div>
    </StagePlate>
  );
}
