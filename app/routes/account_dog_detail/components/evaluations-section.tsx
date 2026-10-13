import type { Evaluation } from "~/orpc/evaluation/contract";
import { EvaluationCard } from "~/routes/account_dog_detail/components/evaluation-card";

/*===== Evaluations Section =====*/
/** F3 on the dog's page: every evaluation request of this dog, newest first (as the API returns them). */
export function EvaluationsSection({ evaluations }: { evaluations: Evaluation[] }) {
  return (
    <section aria-labelledby="evaluations-title">
      <h2 id="evaluations-title" className="font-sans text-xl font-extrabold">
        ارزیابی
      </h2>

      {evaluations.length === 0 ? (
        <div className="mt-4 rounded-3xl border bg-card p-5 sm:p-6">
          <p className="font-bold">هنوز درخواستی نفرستادم</p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {evaluations.map((evaluation) => (
            <EvaluationCard key={evaluation.id} evaluation={evaluation} />
          ))}
        </ul>
      )}
    </section>
  );
}
