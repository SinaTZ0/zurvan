import { cn } from "cn";
import { PlusIcon } from "lucide-react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { NEW_DOG_LINK } from "~/routes/assessment/components/dog-picker";
import { PLATE } from "~/routes/assessment/components/form-plate";
import { TapedPrint } from "~/routes/assessment/components/taped-print";

/*===== No Dogs Plate =====*/
/**
 * In the form's place for an account with no dog yet: an evaluation is for one named dog, so the way on is to introduce
 * one, and the dog form brings the customer straight back here with it picked. The empty print with its «؟» tag stands
 * for the dog that isn't there yet; the guide beside it (the sniffing dog by the empty kennel) says the same.
 */
export function NoDogsPlate() {
  return (
    <section aria-labelledby="no-dogs-title" className={cn(PLATE, "answer-in p-6 sm:p-8")}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <TapedPrint name="؟" photo={null} size="md" tilt="-rotate-3" className="self-start sm:self-center" />
        <div className="min-w-0">
          <h2 id="no-dogs-title" className={cn(DISPLAY_HEADING, "text-h2 text-balance")}>
            اول سگت رو معرفی کن
          </h2>
          <p className="mt-3 max-w-md text-pretty text-muted-foreground">
            ارزیابی برای یه سگ مشخصه؛ اسم و نژادش رو بنویس تا {HEAD_TRAINER.firstName} بشناسدش. بعدش برمی‌گردی همین‌جا.
          </p>
          <Link
            {...NEW_DOG_LINK}
            className={buttonVariants({ variant: "solid", size: "lg", className: "mt-7 w-full sm:w-fit sm:min-w-48" })}
          >
            <PlusIcon aria-hidden />
            معرفی سگ
          </Link>
        </div>
      </div>
    </section>
  );
}
