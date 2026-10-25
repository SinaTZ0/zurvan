import { cn } from "cn";
import { CheckIcon, PawPrintIcon } from "lucide-react";

import { formatNumber } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";
import { DOG_FORM_SECTIONS, DOG_FORM_STEP_COUNT, type DogFormSection } from "~/routes/account_dog_form/sections";

/** Each step's short name on the road. */
const STEP_LABELS: Record<DogFormSection, () => string> = {
  identity: () => m.account_dog_form_step_identity(),
  body: () => m.account_dog_form_step_body(),
  health: () => m.account_dog_form_step_health(),
  training: () => m.account_dog_form_step_training(),
};

/*===== Step Road =====*/
/**
 * The new dog's four steps as a stretch of the site's road (the Dashboard's and the Evaluation Request's): four stops
 * on a dashed chalk line, the walked part drawn in gold up to where the owner is. A passed stop is a gold disc with a
 * tick, the current one a gold ring with the paw that is walking it (the ring breathes), the ones ahead faint numbers.
 * The names sit under the stops, so all four fit a phone's width.
 *
 * Every stop is a button: back is always open, and ahead goes through the steps' checks first (`onPick`), stopping at
 * the first step with a red field. The walked line grows and shrinks (`df-walk`, a scale from the start side).
 */
export function StepRoad({ step, onPick }: { step: number; onPick: (step: number) => void }) {
  const walked = (step - 1) / (DOG_FORM_STEP_COUNT - 1);

  return (
    <nav aria-label={m.account_dog_form_steps_label()} className="relative">
      <p className="sr-only" aria-live="polite">
        {m.account_dog_form_step_of({ step: formatNumber(step), count: formatNumber(DOG_FORM_STEP_COUNT) })}
      </p>

      {/*===== The Road =====*/}
      {/* From the first stop's centre to the last's (each stop is centred in a quarter). */}
      <div aria-hidden className="pointer-events-none absolute inset-x-[12.5%] top-5 -translate-y-1/2">
        <div className="border-t-2 border-dashed border-foreground/25" />
        <div
          className="df-walk absolute inset-x-0 -top-px h-[3px] rounded-full bg-primary ltr:origin-left rtl:origin-right"
          style={{ transform: `scaleX(${walked})` }}
        />
      </div>

      {/*===== Stops =====*/}
      <ol className="relative grid grid-cols-4">
        {DOG_FORM_SECTIONS.map((section, index) => {
          const number = index + 1;
          const state = number < step ? "done" : number === step ? "current" : "ahead";
          return (
            <li key={section} className="flex justify-center">
              <button
                type="button"
                onClick={() => onPick(number)}
                aria-current={state === "current" ? "step" : undefined}
                className="group/stop flex min-w-0 flex-col items-center gap-2 rounded-2xl px-1 pb-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span
                  className={cn(
                    "relative grid size-10 shrink-0 place-items-center rounded-full border-2 bg-background text-sm font-bold transition-colors",
                    state === "done" && "border-primary bg-primary text-primary-foreground",
                    state === "current" && "border-primary text-primary",
                    state === "ahead" &&
                      "border-foreground/25 text-muted-foreground group-hover/stop:border-primary/60",
                  )}
                >
                  {/* The current stop's ring breathes around it; a still ring under reduced motion. */}
                  {state === "current" && (
                    <span aria-hidden className="df-ring absolute -inset-1.5 rounded-full border border-primary/50" />
                  )}
                  {state === "done" ? (
                    <CheckIcon key="done" aria-hidden strokeWidth={3} className="df-tick size-5" />
                  ) : state === "current" ? (
                    <PawPrintIcon key="current" aria-hidden strokeWidth={2} className="df-tick size-5" />
                  ) : (
                    <span aria-hidden>{formatNumber(number)}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "max-w-full truncate text-xs sm:text-sm",
                    state === "current" ? "font-bold text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className="sr-only">{formatNumber(number)}. </span>
                  {STEP_LABELS[section]()}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
