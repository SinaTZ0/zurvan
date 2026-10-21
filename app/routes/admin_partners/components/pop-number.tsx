import { cn } from "cn";

import { useChanged } from "~/routes/admin_partners/hooks/use-changed";

/*===== Pop Number =====*/
/**
 * A number that pops (`answer-pop`, app.css) when it changes under him, and only then: the page has no load moment, so
 * the first render shows it still. The span is keyed by the value, so every later change remounts it and plays the pop
 * again. Reduced motion: `answer-pop` is off and the new value is simply there.
 *
 * `delay` lines the pop up with something else that answers the same press (the «پرداخت شد» stamp lands at 0.1s).
 */
export function PopNumber({
  value,
  children,
  delay,
  className,
}: {
  value: number;
  children: React.ReactNode;
  /** Seconds. */
  delay?: number;
  className?: string;
}) {
  const changed = useChanged(value);

  return (
    <span
      key={value}
      style={delay ? ({ "--answer-delay": `${delay}s` } as React.CSSProperties) : undefined}
      className={cn("inline-block [--pop-origin:50%_60%]", changed && "answer-pop", className)}
    >
      {children}
    </span>
  );
}
