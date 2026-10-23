import { PlusIcon } from "lucide-react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { NEW_DOG_LINK } from "~/routes/buy/components/dog-picker";
import { StagePanel } from "~/routes/buy/components/stage-panel";
import { m } from "~/paraglide/messages";

/*===== No Dogs Panel =====*/
/**
 * An account with no dog yet, in place of the prints and the lists: courses are bought for one dog, so the way on is to
 * introduce one, and the dog form brings the customer straight back here. The Dashboard's empty state, same meaning:
 * the center's dog holds up an empty frame by the kennel whose name plate is still blank.
 */
export function NoDogsPanel() {
  return (
    <StagePanel
      titleId="no-dogs-title"
      title={m.buy_no_dogs_title()}
      scene={{
        box: [19, 25],
        scenery: { name: "kennel", width: [10, 14.5], left: [0, 0] },
        dog: { name: "frame", height: [9, 13], left: [9.5, 13.25], head: 0.73 },
        bubble: m.buy_no_dogs_bubble(),
      }}
    >
      <p className="mt-3 max-w-md text-lead text-pretty text-muted-foreground">{m.buy_no_dogs_text()}</p>
      <Link
        {...NEW_DOG_LINK}
        className={buttonVariants({ variant: "solid", size: "lg", className: "mt-7 w-full sm:w-fit sm:min-w-48" })}
      >
        <PlusIcon aria-hidden />
        {m.buy_no_dogs_add()}
      </Link>
    </StagePanel>
  );
}
