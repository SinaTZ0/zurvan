import { LockIcon } from "lucide-react";

/*===== Profile Tag =====*/
/**
 * The person's own tag, as it hangs on the hall stand: a dark engraved plate with a gold hairline, a punched hole at
 * the top for its ring, the initial on an engraved disc (the person menu's, scaled up), the name stamped in gold, the
 * role where it isn't obvious (a partner's «همکار»), and the sign-in number on a locked plate.
 *
 * The name is the form's, as typed: the page passes it once the person pauses, and each new name is pressed in again
 * (`animate-tag-stamp`, keyed by the name). Everything but the number is an echo of the form and the person menu, so it
 * is hidden from assistive tech; the number is real information, read as text.
 *
 * Phones: the disc and name in a row and the number on one line, so the tag fits a short stage. From `lg` a larger
 * plate with the label over the number.
 */
export function ProfileTag({
  initial,
  name,
  roleLabel,
  phoneNumber,
}: {
  initial: string;
  name: string;
  /** A partner's role label; null for a customer, whose role is obvious. */
  roleLabel: string | null;
  phoneNumber: string | null;
}) {
  return (
    <div className="relative w-[15.5rem] rounded-[1.6rem] border border-primary/55 bg-jet paper-grain px-4 pt-6 pb-3.5 shadow-[0_22px_40px_-16px_rgb(0_0_0/0.95)] lg:w-[16rem] lg:rounded-[2rem] lg:px-5 lg:pt-8 lg:pb-4">
      {/*------ Engraving ------*/}
      {/* A second hairline just inside the edge, as engraved plates have, and the hole the ring goes through. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-1.5 rounded-[1.3rem] border border-primary/15 lg:rounded-[1.65rem]"
      />
      <span
        aria-hidden
        className="absolute inset-x-0 top-2 mx-auto size-3 rounded-full border border-primary/40 bg-sunken shadow-[inset_0_1px_2px_rgb(0_0_0/0.9)] lg:top-3 lg:size-3.5"
      />

      {/*------ Disc and Name ------*/}
      <div aria-hidden className="relative flex items-center gap-3 lg:gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-primary/45 bg-sunken font-display text-2xl font-black text-primary shadow-[inset_0_1px_3px_rgb(0_0_0/0.8)] lg:size-14 lg:text-3xl">
          {initial}
        </span>
        <div className="min-w-0">
          {/* A name can be Latin; `bdi` keeps it from flipping the words around it. */}
          <p className="font-display text-xl leading-tight font-extrabold break-words text-primary lg:text-[1.65rem]">
            <bdi key={name} className="inline-block motion-safe:animate-tag-stamp">
              {name}
            </bdi>
          </p>
          {roleLabel && <p className="mt-0.5 text-xs font-bold text-muted-foreground lg:text-sm">{roleLabel}</p>}
        </div>
      </div>

      {/*------ Locked Number ------*/}
      {phoneNumber && (
        <div className="relative mt-3 flex items-center gap-2.5 rounded-2xl border border-foreground/10 bg-sunken px-3 py-2 lg:mt-4 lg:px-4 lg:py-2.5">
          <LockIcon aria-hidden strokeWidth={1.8} className="size-4 shrink-0 text-primary/80 lg:size-5" />
          <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2 lg:flex-col lg:items-start lg:gap-0.5">
            <p className="text-[0.7rem] whitespace-nowrap text-muted-foreground lg:text-xs">شماره‌ی ورود</p>
            <p dir="ltr" className="text-sm font-bold tabular-nums lg:text-base lg:tracking-wide">
              {phoneNumber}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
