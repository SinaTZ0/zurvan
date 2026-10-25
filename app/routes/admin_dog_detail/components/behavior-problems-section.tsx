import { cn } from "cn";

import { ADMIN_PLATE } from "~/lib/admin-plate";
import type { AdminDog } from "~/orpc/dog/contract";
import { DetailSection } from "~/routes/admin_dog_detail/components/detail-section";
import { QUIET_LINE } from "~/routes/admin_dog_detail/surfaces";

/*===== Behavior Problems Section =====*/
/**
 * What the owner says is wrong with the dog's behavior, one problem per line, right above the diary: it is what the
 * Admin reads before he writes a session. The owner may have written none, which is said in one quiet line like the
 * other empty sections.
 */
export function BehaviorProblemsSection({ problems }: { problems: AdminDog["behaviorProblems"] }) {
  return (
    <DetailSection id="problems" title="مشکلات رفتاری">
      {problems.length === 0 ? (
        <p className={QUIET_LINE}>صاحبش مشکلی ننوشته.</p>
      ) : (
        <ul className={cn(ADMIN_PLATE, "flex flex-col gap-2.5 px-4 py-4 sm:px-5")}>
          {problems.map((problem) => (
            <li key={problem} className="flex items-start gap-3 text-sm leading-6 text-pretty">
              {/* The bullet is a small gold dot, aligned to the first line of text. */}
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="min-w-0 break-words" dir="auto">
                {problem}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}
