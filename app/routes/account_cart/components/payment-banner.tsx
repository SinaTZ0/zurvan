import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { PURCHASES_PATH } from "~/orpc/checkout/constants";
import { DogSays } from "~/routes/account_cart/components/dog-says";

/*===== Payment Banner =====*/
/**
 * The gateway's result, spoken by the dog (F5). It is the page's one orchestrated moment: the bubble draws in.
 *
 * `paid` has nowhere else to look (the cart was emptied), so it offers the two next steps; `failed` is a plain
 * message, because the cart is right below it and the way on is «پرداخت» again.
 */
export function PaymentBanner({ result }: { result: "paid" | "failed" }) {
  if (result === "paid") {
    return (
      <DogSays
        drawIn
        label="نتیجه‌ی پرداخت"
        bubble="یاهو! پرداخت شد"
        className="rounded-4xl border-primary/25 lg:min-h-72"
      >
        <output className="block max-w-md text-lg font-bold text-pretty">
          پرداخت انجام شد؛ برای هماهنگی با شما تماس می‌گیریم
        </output>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to={PURCHASES_PATH} className={buttonVariants({ variant: "solid", size: "lg" })}>
            دیدن خریدها
          </Link>
          <Link to="/account" className={buttonVariants({ variant: "outline", size: "lg" })}>
            سگ‌های من
          </Link>
        </div>
      </DogSays>
    );
  }

  return (
    <DogSays drawIn label="نتیجه‌ی پرداخت" bubble="این‌بار نشد… سبدم سر جاشه" className="rounded-4xl border-primary/25">
      <output className="block max-w-md text-lg font-bold text-pretty">
        پرداخت انجام نشد و سبد شما همان‌طور مانده.
      </output>
    </DogSays>
  );
}
