import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { DogSays } from "~/routes/account_cart/components/dog-says";

/*===== Cart Error =====*/
/**
 * The review couldn't be loaded. The cart itself is in the browser and is fine, so the dog says that; without the
 * review there are no prices or verdicts, and so no way to pay until it loads.
 */
export function CartError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <DogSays label="سبد باز نشد" bubble="سبدم رو نتونستم بخونم" className="rounded-3xl lg:min-h-64">
      <p className="max-w-md text-pretty text-muted-foreground">
        قیمت‌ها و وضعیت دوره‌ها بارگذاری نشد. موردهای سبدت سر جاشونه.
      </p>
      <Button type="button" variant="solid" size="lg" onClick={onRetry} disabled={retrying} className="mt-5">
        {retrying && <Spinner aria-hidden />}
        دوباره امتحان کن
      </Button>
    </DogSays>
  );
}
