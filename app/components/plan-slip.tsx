import { cn } from "cn";

import { formatToman } from "~/lib/course-format";
import { describePlanDaysLeft } from "~/lib/behavior-format";
import { formatNumberFa } from "~/lib/digits";
import { BEHAVIOR_PLAN_VALID_DAYS } from "~/orpc/behavior-request/constants";

/*===== Plan Slip =====*/
// The behavior plan's paper (docs/behavior-design.md, "The One Idea"): the third piece of the paper trail after the
// assessment slip and the receipt. It carries what the trainer proposed: sessions, the price set large, his note
// quoted and signed. Along its bottom edge runs a strip of seven notches, one per day of validity, punched out one per
// day that has passed, so the strip is the whole deadline. It is static: the page's moment belongs to the stamp.

/** What the slip shows of a plan. `null` fields render as quiet placeholders (the trainer's preview before typing). */
export type PlanSlipPlan = {
  sessions: number | null;
  /** Rial. */
  price: number | null;
  note: string;
};

/*------ Notches ------*/
/**
 * Seven notches, the first `BEHAVIOR_PLAN_VALID_DAYS - daysLeft` punched. A plan that was just proposed has seven whole
 * ones; an expired one has none left. `small` is for the trainer's ledger rows.
 */
export function PlanNotches({ daysLeft, small = false }: { daysLeft: number; small?: boolean }) {
  const left = Math.min(BEHAVIOR_PLAN_VALID_DAYS, Math.max(0, daysLeft));
  const punched = BEHAVIOR_PLAN_VALID_DAYS - left;

  return (
    <span className={cn("flex items-center", small ? "gap-1" : "gap-2")}>
      {/* The notches are drawn only; a screen reader gets the same fact as a sentence. */}
      <span className="sr-only">
        {left === 0 ? "فرصت پرداخت تمام شده" : `${formatNumberFa(left)} روز از فرصت پرداخت مانده`}
      </span>
      {Array.from({ length: BEHAVIOR_PLAN_VALID_DAYS }, (_, index) =>
        index < punched ? (
          // Punched: the page shows through, pressed in like a held session's hole.
          <span
            aria-hidden
            key={index}
            className={cn(
              "rounded-full bg-background shadow-[inset_0_2px_4px_rgb(0_0_0/0.6)]",
              small ? "size-2.5" : "size-4",
            )}
          />
        ) : (
          <span
            aria-hidden
            key={index}
            className={cn("rounded-full border border-primary/60 bg-primary/15", small ? "size-2.5" : "size-4")}
          />
        ),
      )}
    </span>
  );
}

/*------ Slip ------*/
/**
 * The plan slip.
 *
 * @param daysLeft Days still payable (0 to 7); `null` while the trainer is composing and nothing has started to run.
 * @param deadline «شنبه ۲۶ مهر ساعت ۱۷:۰۰», the moment the plan stops being payable.
 * @param signer The name the note is signed with.
 * @param muted An expired plan: the same slip, quiet, with «منقضی شد» across the strip.
 * @param compact A smaller slip for a ledger row (a paid or expired plan, opened in place).
 */
export function PlanSlip({
  plan,
  daysLeft,
  deadline,
  signer,
  muted = false,
  compact = false,
  className,
}: {
  plan: PlanSlipPlan;
  daysLeft: number | null;
  deadline?: string | null;
  signer: string;
  muted?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const days = daysLeft ?? BEHAVIOR_PLAN_VALID_DAYS;

  return (
    <section
      aria-label="برنامه‌ی پیشنهادی"
      className={cn(
        "relative rounded-2xl bg-sunken shadow-[inset_0_2px_12px_rgb(0_0_0/0.35)]",
        compact ? "p-4" : "p-5 lg:p-6",
        muted && "opacity-70",
        className,
      )}
    >
      {/*------ Sessions and Price ------*/}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">برنامه‌ی آرمان</p>
          <p className={cn("mt-1 font-extrabold tabular-nums", compact ? "text-lg" : "text-xl")}>
            {plan.sessions === null ? (
              <span className="text-muted-foreground/70">— جلسه</span>
            ) : (
              `${formatNumberFa(plan.sessions)} جلسه`
            )}
          </p>
        </div>
        <p
          className={cn(
            "font-extrabold tabular-nums",
            compact ? "text-xl" : "text-2xl",
            plan.price === null && "text-muted-foreground/70",
          )}
        >
          {plan.price === null ? "— تومان" : formatToman(plan.price)}
        </p>
      </div>

      {/*------ Note ------*/}
      <blockquote className="mt-4 border-s-2 border-primary/50 ps-3">
        {plan.note.trim() === "" ? (
          <p className="text-sm text-muted-foreground/70">توضیح برنامه اینجا می‌آید.</p>
        ) : (
          <p className="text-sm leading-7 text-pretty whitespace-pre-line">{plan.note}</p>
        )}
        <footer className="mt-1 text-sm text-muted-foreground">— {signer}</footer>
      </blockquote>

      {/*------ Notch Strip ------*/}
      {/* The perforated edge: a dashed rule, then one notch per day of validity. */}
      <div className="mt-5 border-t-2 border-dashed border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <PlanNotches daysLeft={days} />
          <span className={cn("text-sm font-bold", muted ? "text-muted-foreground" : "text-primary")}>
            {muted ? "منقضی شد" : describePlanDaysLeft(days)}
          </span>
        </div>
        {deadline && (
          <p className="mt-2 text-sm text-muted-foreground">
            {muted ? "فرصت پرداخت تا" : "تا"} {deadline} {muted ? "بود" : "فرصت پرداخت داری"}
          </p>
        )}
      </div>
    </section>
  );
}
