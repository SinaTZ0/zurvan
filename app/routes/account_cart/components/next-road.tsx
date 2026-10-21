import { cn } from "cn";

import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Steps =====*/
// What happens after a paid cart, only from the FAQ («بعد از پرداخت چی می‌شه؟», «خرید چطوری کار می‌کنه؟», «دوره کی تموم
// می‌شه؟»; app-spec F5–F6): the call, the training as arranged on it, and the course marked done.
const STEPS = [
  {
    label: `${HEAD_TRAINER.firstName} زنگ می‌زنه`,
    line: "وقت آموزش رو پشت تلفن با هم هماهنگ می‌کنیم.",
  },
  { label: "آموزش", line: "همون‌جا که توی تماس قرار می‌ذاریم؛ پیش تو یا توی مرکز." },
  {
    label: "تموم شد",
    line: `${HEAD_TRAINER.firstName} دوره رو تمام‌شده ثبت می‌کنه و دوره‌های بعدی سگت باز می‌شن.`,
  },
] as const;

/*===== Next Road =====*/
/**
 * «بعدش چی می‌شه؟» under the paid banner: three stops on a dashed chalk line, the first (the call) lit with a breathing
 * halo. Phones run it down the start side; from `sm` across in reading direction. Each segment is drawn inside the stop
 * it leaves, from its disc's centre to the next one's, and draws itself on after the banner's leap (`ct-draw`, one after
 * the other).
 */
export function NextRoad() {
  return (
    <ol className="grid gap-y-6 sm:grid-cols-3 sm:gap-y-0">
      {STEPS.map((step, index) => {
        const last = index === STEPS.length - 1;
        const lit = index === 0;
        return (
          <li
            key={step.label}
            className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-4 sm:flex sm:flex-col sm:gap-y-3 sm:pe-6"
          >
            {/*------ Segment ------*/}
            {!last && (
              <span
                aria-hidden
                style={{ "--ct-delay": `${1.1 + index * 0.35}s` } as React.CSSProperties}
                className={cn(
                  "ct-draw absolute start-[calc(1.25rem-1px)] top-5 h-[calc(100%+1.5rem)] w-0.5 text-foreground/35",
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
                  : "border-2 border-foreground/30 bg-sunken text-muted-foreground",
              )}
            >
              {lit && <span className="ct-halo absolute -inset-0.5 rounded-full border-2 border-primary/50" />}
              {formatNumberFa(index + 1)}
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
