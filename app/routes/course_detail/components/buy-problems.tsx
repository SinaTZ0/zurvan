import { CircleAlertIcon } from "lucide-react";

import { Link } from "~/components/link";
import type { DogVerdictProblem } from "~/lib/dog-verdict";

/** The picked dog's radio points here, so a screen reader hears the reasons with the dog's name. */
export const BUY_PROBLEMS_ID = "buy-problems";

/*===== Buy Problems =====*/
/**
 * Why the picked dog can't take the course, under the disabled «افزودن به سبد»: the server's own reasons, written
 * plainly about the dog (not in its voice, which stays in its bubble above), in the error red with an icon so colour
 * isn't the only sign. Each reason that has a way out links to it (the free evaluation, or the course to take first).
 */
export function BuyProblems({ problems }: { problems: readonly DogVerdictProblem[] }) {
  return (
    <ul id={BUY_PROBLEMS_ID} className="answer-in flex flex-col gap-2 text-sm text-destructive">
      {problems.map((problem) => (
        <li key={problem.message} className="flex items-start gap-2 text-pretty">
          <CircleAlertIcon aria-hidden strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
          <span>
            {problem.message}
            {problem.way && (
              <>
                {" "}
                <Link
                  {...problem.way.link}
                  className="rounded-sm font-bold whitespace-nowrap underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {problem.way.label}
                </Link>
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
