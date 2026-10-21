import { cn } from "cn";

/*===== Current Mark =====*/
/**
 * The flat-gold notch on the start edge of the current page's pill, in the rail and in the «بیشتر» sheet: the only gold
 * the shell shows besides the counts. It mounts with its item, so `grow` (set once he has moved to another page) makes
 * it grow in from its middle; on the first load it is simply there.
 */
export function CurrentMark({ grow }: { grow: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("absolute inset-y-3 start-1.5 w-1 rounded-full bg-primary", grow && "admin-mark-grow")}
    />
  );
}
