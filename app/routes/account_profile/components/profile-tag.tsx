import { LockIcon } from "lucide-react";

/*===== Profile Tag =====*/
/**
 * The person's own tag: the engraved initial (the person menu's disc, scaled up), the name as it will be stamped, the
 * role where it isn't obvious, and the sign-in number on a locked plate. It follows the name form live, so the name is
 * "engraved" as it is typed; the page passes the live values and falls back to the saved ones when the fields are empty.
 *
 * The cut-out dog leans out over the card's top edge with its bubble beside it. The dog zone sits above the card in the
 * document and is pulled down behind the card with a negative margin, so the card's edge hides the dog's lower part
 * (a cut-out ends in a flat edge that would show if it stood in front). It is the stock dog, not the customer's: a decoration, so its `alt` is empty. Everything inside is a visual echo of the form and
 * the person menu, so the card is `aria-hidden` except the phone plate, which is real information.
 *
 * Phones: a compact card, the disc and name in a row, the dog small. Desktop: the disc above the name, the dog larger.
 */
export function ProfileTag({
  initial,
  name,
  roleLabel,
  phoneNumber,
  bubble,
  className,
}: {
  initial: string;
  name: string;
  /** A partner's role label; null for a customer, whose role is obvious. */
  roleLabel: string | null;
  phoneNumber: string | null;
  /** The dog's `ProfileBubble`. */
  bubble: React.ReactNode;
  className?: string;
}) {
  return (
    <aside aria-label="کارت من" className={className}>
      {/*===== Dog And Bubble =====*/}
      {/* Pulled behind the card's top edge: the dog's head and chest are above it, the rest is hidden. Pointer events
          pass through so the zone never blocks the card. */}
      <div className="pointer-events-none relative z-0 -mb-7 flex items-end justify-between gap-2 px-3 lg:-mb-14 lg:px-6">
        <div className="pb-9 lg:pb-20">{bubble}</div>
        <img
          src="/photo/home/eval-dog-640.webp"
          alt=""
          width={640}
          height={879}
          className="h-auto w-28 shrink-0 sm:w-32 lg:w-40"
        />
      </div>

      {/*===== Card =====*/}
      <div className="relative z-10 rounded-3xl border border-border bg-card p-5 shadow-sm lg:p-8">
        {/*------ Disc And Name ------*/}
        <div aria-hidden className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-6">
          <span className="grid size-14 shrink-0 place-items-center rounded-full border border-primary/40 font-display text-3xl font-black text-primary lg:size-24 lg:text-6xl">
            {initial}
          </span>
          <div className="min-w-0">
            {/* A name can be Latin; `bdi` keeps it from flipping the words around it. Updated instantly: no stamp
                animation, the page's only motion is the bubble. */}
            <p className="font-display text-2xl font-black break-words lg:text-3xl">
              <bdi>{name}</bdi>
            </p>
            {roleLabel && <p className="mt-1 text-sm text-muted-foreground">{roleLabel}</p>}
          </div>
        </div>

        {/*------ Locked Number ------*/}
        {phoneNumber && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-sunken px-4 py-3 lg:mt-8">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">شماره‌ی ورود</p>
              <p dir="ltr" className="mt-0.5 text-start font-bold tabular-nums">
                {phoneNumber}
              </p>
            </div>
            <LockIcon aria-hidden strokeWidth={1.7} className="size-5 shrink-0 text-muted-foreground" />
          </div>
        )}
      </div>
    </aside>
  );
}
