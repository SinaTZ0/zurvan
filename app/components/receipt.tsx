import { cn } from "cn";

import { formatToman } from "~/lib/course-format";

/*===== Receipt =====*/
// The paper the money is written on (docs/training-design.md): the assessment's slip, now carrying amounts. It fills
// in on the booking page, is the whole checkout, and is stamped on the payment result. Amounts are exact toman in
// Persian digits; a line that takes money off shows a minus.

/**
 * The receipt's plate. Holds `ReceiptLine`s and a `ReceiptTotal`, and anything else the page puts under them (the
 * refund sentence, the button). Relative, so a `Stamp` can land on its corner.
 */
export function Receipt({
  title,
  aside,
  children,
  className,
}: {
  title: string;
  /** At the title's end, e.g. the order number. */
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn("relative rounded-3xl bg-sunken p-5 shadow-[inset_0_2px_12px_rgb(0_0_0/0.35)] lg:p-8", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold text-saffron-text">{title}</h2>
        {aside && <span className="text-sm text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

/** The ruled lines. Each child is a `ReceiptLine`. */
export function ReceiptLines({ children }: { children: React.ReactNode }) {
  return <dl className="mt-4 divide-y">{children}</dl>;
}

/**
 * One line: what it is, and its amount at the end. `amount` is Rial; a `credit` line (a discount, the wallet) takes
 * money off and is written with a minus. Without an amount the line only describes something (a dog, a place).
 */
export function ReceiptLine({
  label,
  children,
  amount,
  credit = false,
  placeholder = false,
}: {
  label: string;
  children: React.ReactNode;
  amount?: number;
  credit?: boolean;
  /** Not filled in yet: the value reads as a quiet placeholder. */
  placeholder?: boolean;
}) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-x-3 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0", placeholder ? "text-sm font-medium text-muted-foreground" : "font-bold")}>
        {children}
      </dd>
      <dd className={cn("flex items-baseline justify-end gap-1 tabular-nums", credit ? "text-success" : "font-bold")}>
        {amount !== undefined && credit && (
          // Its own element, so bidi can't move it after «تومان»: in RTL it sits first, where the eye starts.
          <span aria-label="منهای">−</span>
        )}
        {amount !== undefined && formatToman(amount)}
      </dd>
    </div>
  );
}

/** The amount to pay, set large under a heavier rule. */
export function ReceiptTotal({ label, amount, note }: { label: string; amount: number; note?: React.ReactNode }) {
  return (
    <div className="mt-1 border-t-2 border-foreground/25 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-bold">{label}</span>
        <span className="text-2xl font-extrabold tabular-nums">{formatToman(amount)}</span>
      </div>
      {note && <p className="mt-1 text-sm text-pretty text-muted-foreground">{note}</p>}
    </div>
  );
}
