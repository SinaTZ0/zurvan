import { cn } from "cn";

/*===== Verdict Disc =====*/
/**
 * The small round icon beside the verdict's h1: gold for valid, red for revoked, muted for not found. It replaces the
 * old bare icon above the headline; the stage does the talking now, the disc only says it in one glance.
 */
export function VerdictDisc({ tone, children }: { tone: "gold" | "red" | "muted"; children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full border sm:size-12 [&_svg]:size-6",
        tone === "gold" && "border-primary/45 bg-primary/15 text-primary",
        tone === "red" && "border-destructive/45 bg-destructive/15 text-destructive",
        tone === "muted" && "border-foreground/20 bg-foreground/10 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
