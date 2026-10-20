import { cn } from "cn";
import { CheckIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { DogThumb } from "~/components/dog-thumb";
import { getDogVerdict, type DogVerdict } from "~/lib/dog-verdict";
import type { DogEligibility } from "~/orpc/checkout/contract";
import { BUY_PROBLEMS_ID } from "~/routes/course_detail/components/buy-problems";

/*===== Dog Row List =====*/
/**
 * «برای کدوم سگ؟»: the customer's dogs as one radio group. Each row says at a glance whether that dog can take this
 * course; picking a row opens the dog's own bubble under it. When the dog can't take the course, the plain reasons and
 * the way out of each sit under the buy button instead (`BuyProblems`, id `BUY_PROBLEMS_ID`): the bubble is the dog
 * talking, the reasons are the site's.
 *
 * Native radios sit under the rows (screen-reader-only), so arrow keys, focus and the group's name come from the
 * browser. Every dog stays in the list, including the ones that can't buy: hiding them would leave the owner wondering
 * where the dog went.
 */
export function DogRowList({
  dogs,
  pickedId,
  verdict,
  onPick,
}: {
  dogs: readonly DogEligibility[];
  pickedId: string | null;
  /** The picked dog's verdict, already worked out by the page's state. */
  verdict: DogVerdict | null;
  onPick: (dogId: string) => void;
}) {
  return (
    <div role="radiogroup" aria-labelledby="dog-list-title">
      <p id="dog-list-title" className="text-base font-extrabold">
        برای کدوم سگ؟
      </p>

      <ul className="mt-3 flex flex-col gap-2.5">
        {dogs.map((entry) => {
          const { dog } = entry;
          const isPicked = dog.id === pickedId;
          const can = getDogVerdict({ ...entry, dogId: dog.id }).can;
          const bubbleId = `dog-bubble-${dog.id}`;

          return (
            <li key={dog.id}>
              <label className="block">
                <input
                  type="radio"
                  name="course-dog"
                  value={dog.id}
                  checked={isPicked}
                  onChange={() => onPick(dog.id)}
                  aria-describedby={
                    isPicked && verdict ? (verdict.can ? bubbleId : `${bubbleId} ${BUY_PROBLEMS_ID}`) : undefined
                  }
                  className="peer sr-only"
                />
                {/*------ Row ------*/}
                <span
                  className={cn(
                    "flex min-h-18 cursor-pointer items-center gap-3 rounded-2xl border bg-sunken p-2.5 pe-4 transition-colors",
                    "border-border hover:border-primary/50",
                    "peer-checked:border-primary peer-checked:bg-primary/10",
                    "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                  )}
                >
                  <DogThumb name={dog.name} photo={dog.photo} />
                  <span className="min-w-0 flex-1 truncate font-extrabold">{dog.name}</span>
                  <VerdictMark can={can} />
                </span>
              </label>

              {/*------ Bubble ------*/}
              {/* The customer's own dog speaking, under its own row. Flush with the row's start (right) edge, so the
                  tail (physical right, 1.75rem in) lands on the thumbnail's centre. A new key remounts it for each
                  dog picked: it answers the click. */}
              {isPicked && verdict && (
                <div id={bubbleId} className="mt-4">
                  <ChalkBubble
                    key={dog.id}
                    tail="right"
                    tailEdge="top"
                    // It pops from its tail, up at the row's start corner.
                    className="answer-pop max-w-full [--pop-origin:calc(100%-1.75rem)_0]"
                  >
                    {verdict.line}
                  </ChalkBubble>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/*===== Verdict Mark =====*/
/** «می‌تونه» in gold or «هنوز نه» in muted text: words, not colour alone. */
function VerdictMark({ can }: { can: boolean }) {
  return can ? (
    <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-foreground">
      <CheckIcon aria-hidden className="size-4" strokeWidth={2.6} />
      می‌تونه
    </span>
  ) : (
    <span className="shrink-0 text-sm font-bold text-muted-foreground">هنوز نه</span>
  );
}
