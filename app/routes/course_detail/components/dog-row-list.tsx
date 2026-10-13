import { cn } from "cn";
import { CheckIcon } from "lucide-react";

import { DogThumb } from "~/components/dog-thumb";
import { Link } from "~/components/link";
import { SpeechBubble } from "~/components/speech-bubble";
import { getDogVerdict, type DogVerdict } from "~/lib/dog-verdict";
import type { DogEligibility } from "~/orpc/checkout/contract";

/*===== Dog Row List =====*/
/**
 * «برای کدوم سگ؟»: the customer's dogs as one radio group. Each row says at a glance whether that dog can take this
 * course; picking a row opens the dog's own bubble under it, with its reason and the way out of it.
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
                  aria-describedby={isPicked && verdict ? bubbleId : undefined}
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
              {/* Under its own row, the tail pointing up at the thumbnail at the start side. A new key redraws it
                  for each dog picked: it answers the click. */}
              {isPicked && verdict && (
                <div id={bubbleId} className="mt-3 ps-1">
                  <SpeechBubble key={dog.id} drawIn tail="top-start" className="max-w-full sm:max-w-80">
                    {verdict.line}
                  </SpeechBubble>

                  {verdict.problems.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-2.5 ps-1 text-sm text-muted-foreground">
                      {verdict.problems.map((problem) => (
                        <li key={problem.message} className="text-pretty">
                          {problem.message}
                          {problem.way && (
                            <>
                              {" "}
                              <Link
                                to={problem.way.to}
                                className="rounded-sm font-bold whitespace-nowrap text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                              >
                                {problem.way.label}
                              </Link>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
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
    <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary">
      <CheckIcon aria-hidden className="size-4" strokeWidth={2.6} />
      می‌تونه
    </span>
  ) : (
    <span className="shrink-0 text-sm font-bold text-muted-foreground">هنوز نه</span>
  );
}
