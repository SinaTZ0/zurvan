import { cn } from "cn";

import { formatNumber } from "~/lib/locale-format";
import { nextSteps } from "~/routes/assessment/guide";

/*===== Next Road =====*/
/**
 * «از این به بعد چی می‌شه؟» on the receipt: the three next steps as stops on a chalk line, the first (the call) lit.
 * Phones run it down the start side (a disc and its words per row); from `sm` it runs across in reading direction,
 * each stop's words under its disc. As on the header's road, each segment is drawn inside the stop it leaves, from its
 * disc's centre to the next one's.
 */
export function NextRoad() {
  const steps = nextSteps();

  return (
    <ol className="grid gap-y-6 sm:grid-cols-3 sm:gap-y-0">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const lit = index === 0;
        return (
          <li
            key={step.label}
            aria-current={lit ? "step" : undefined}
            className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-4 sm:flex sm:flex-col sm:gap-y-3 sm:pe-6"
          >
            {/*------ Segment ------*/}
            {/* Plain dashed lines, as on the header's road: down on a phone, across from `sm`. */}
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute start-[calc(1.25rem-1px)] top-5 h-[calc(100%+1.5rem)] w-0.5 text-foreground/35",
                  "bg-[repeating-linear-gradient(to_bottom,currentColor_0_7px,transparent_7px_13px)]",
                  "sm:start-5 sm:top-[calc(1.25rem-1px)] sm:h-0.5 sm:w-full",
                  "sm:bg-[repeating-linear-gradient(to_left,currentColor_0_7px,transparent_7px_13px)]",
                )}
              />
            )}

            {/*------ Disc ------*/}
            <span
              aria-hidden
              className={cn(
                "relative z-10 grid size-10 place-items-center rounded-full font-display font-black",
                lit
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-foreground/30 bg-background text-muted-foreground",
              )}
            >
              {lit && <span className="as-halo absolute -inset-0.5 rounded-full border-2 border-primary/50" />}
              {formatNumber(index + 1)}
            </span>

            {/*------ Words ------*/}
            <div className="min-w-0 pt-1.5 sm:pt-0">
              <p className={cn("font-extrabold", lit ? "text-primary" : "text-foreground")}>{step.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{step.line}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
