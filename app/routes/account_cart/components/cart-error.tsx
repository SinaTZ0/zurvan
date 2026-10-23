import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut } from "~/components/mascot-cut";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { m } from "~/paraglide/messages";
import { StagePlate } from "~/routes/account_cart/components/stage-plate";

/*===== Cart Error =====*/
/**
 * The review couldn't be loaded. The cart itself is fine (it is kept in the account and the browser), so the words say
 * so; without the review there are no prices or verdicts, and so nothing to pay until it loads. The sorry dog sits by
 * the dimmed till.
 */
export function CartError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <StagePlate
      titleId="cart-error-title"
      title={m.account_cart_error_title()}
      stage={
        // Physical sides: the till behind him on the left, his bubble's tail (left, 1.75rem in) on his head.
        <div className="absolute bottom-[0.9rem] left-[52%] w-28 -translate-x-1/2 lg:bottom-[1.2rem] lg:w-[10rem]">
          <MascotCut name="register" className="absolute right-[78%] bottom-0 w-[120%] translate-y-[3%]" />
          <MascotCut
            name="plants"
            className="lively-sway-2 absolute right-[185%] bottom-0 w-[42%] translate-y-[6%] -scale-x-100"
          />
          <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[78%] w-[50%] translate-y-[6%]" />
          <MascotCut name="sorry" className="lively-breathe relative block w-full translate-y-[3%]" />
          <ChalkBubble
            tail="left"
            className="answer-pop absolute bottom-[96%] left-[30%] w-max max-w-[11rem] text-pretty [--answer-delay:0.3s] [--pop-origin:1.75rem_100%] lg:max-w-[14rem]"
          >
            {m.account_cart_error_bubble()}
          </ChalkBubble>
        </div>
      }
    >
      <p className="mt-3 max-w-lg text-lead text-pretty text-muted-foreground">{m.account_cart_error_line()}</p>
      <Button type="button" variant="solid" size="lg" onClick={onRetry} disabled={retrying} className="mt-7">
        {retrying && <Spinner aria-hidden />}
        {m.account_cart_error_retry()}
      </Button>
    </StagePlate>
  );
}
