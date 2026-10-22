import { cn } from "cn";
import { useState } from "react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import type { DogStatus } from "~/lib/dog-status";
import type { Evaluation } from "~/orpc/evaluation/contract";
import { EdgeDog } from "~/routes/account_dog_detail/components/edge-dog";
import { EvaluationCard } from "~/routes/account_dog_detail/components/evaluation-card";
import { SectionHead } from "~/routes/account_dog_detail/components/section-head";
import { PLATE } from "~/routes/account_dog_detail/plate";

/*===== Evaluations Section =====*/
/**
 * F3 on the dog's page: every evaluation request of this dog, newest first (as the API returns them).
 *
 * While a request waits, the `wait-phone` dog lies on the newest card's top edge, chin on his paws, watching the old
 * phone for the trainer's call. He has no bubble: the dog's own line in the hero already says it. A customer can't ask
 * again while one waits, so the waiting request is always the newest, the card under him. Once it is withdrawn he
 * sinks back behind the edge (`dd-sink`); he stays in the row, invisible, so nothing below jumps, and his bushes stay where they grow.
 *
 * None yet: one plate with the status action («ارزیابی رایگان») as a gold button.
 */
export function EvaluationsSection({ evaluations, status }: { evaluations: Evaluation[]; status: DogStatus }) {
  const waiting = evaluations[0]?.status === "requested";
  const [wasWaiting] = useState(waiting);
  const showDog = waiting || wasWaiting;

  return (
    <section aria-labelledby="evaluations-title">
      <SectionHead id="evaluations-title" title="ارزیابی">
        {showDog && (
          <EdgeDog
            name="wait-phone"
            wide
            riseClassName={waiting ? undefined : "dd-sink motion-reduce:invisible"}
            className="w-40 sm:w-48"
          />
        )}
      </SectionHead>

      {evaluations.length === 0 ? (
        <div className={cn(PLATE, "flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6")}>
          <div>
            <p className="font-bold">هنوز درخواستی نفرستادم</p>
            <p className="mt-1 text-sm text-pretty text-muted-foreground">ارزیابی رایگانه و تعهدی نداره.</p>
          </div>
          {status.action && (
            <Link {...status.action.link} className={buttonVariants({ variant: "solid" })}>
              {status.action.label}
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {evaluations.map((evaluation) => (
            <EvaluationCard key={evaluation.id} evaluation={evaluation} />
          ))}
        </ul>
      )}
    </section>
  );
}
