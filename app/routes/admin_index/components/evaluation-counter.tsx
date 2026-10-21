import { Link } from "~/components/link";

import { PopNumber } from "./pop-number";
import { TileChevron } from "./tile-chevron";

const EVALUATIONS_PATH = "/admin/evaluations";

/*===== Evaluation Counter =====*/
/**
 * The requests waiting for his answer. Above zero it is lit: the count big in Estedad, gold, inside a gold ring, and
 * the whole row is the link to Evaluations. At zero it is one calm line that still opens the list.
 */
export function EvaluationCounter({ count }: { count: number }) {
  if (count === 0) {
    return (
      <Link
        to={EVALUATIONS_PATH}
        className="group -mx-2 flex min-h-10 items-center gap-3 rounded-xl px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="min-w-0 flex-1">درخواستی منتظر جواب نیست</span>
        <TileChevron className="size-4" />
      </Link>
    );
  }

  return (
    <Link
      to={EVALUATIONS_PATH}
      className="group -m-2 flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04]"
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-primary font-display text-2xl leading-none font-black text-primary sm:size-16 sm:text-3xl">
        <PopNumber value={count} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-pretty">درخواست ارزیابی منتظر جوابته</span>
        <span className="mt-0.5 block text-sm text-pretty text-muted-foreground">زنگ بزن و جواب بده.</span>
      </span>
      <TileChevron />
    </Link>
  );
}
