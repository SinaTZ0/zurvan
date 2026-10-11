import { cn } from "cn";

import { toPersianDigits } from "~/lib/digits";

/*===== Booking Part =====*/
/**
 * One numbered part of the booking sheet: a legend with its gold number, the one-line reason it is asked, and its
 * content. The numbers mean something here (it is a sequence), and the part is ruled rather than boxed, like the Dog
 * Form's. `waiting` dims it and takes it out of the tab order until the part before it can be answered.
 */
export function BookingPart({
  number,
  title,
  description,
  waiting = false,
  partRef,
  children,
}: {
  /** Left out where the part stands alone (a visitor sees only the diary), so a lone «۴» doesn't look like a typo. */
  number?: number;
  title: string;
  description?: string;
  waiting?: boolean;
  partRef?: React.Ref<HTMLFieldSetElement>;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      ref={partRef}
      // `inert` also blocks clicks and focus, so a dimmed part can't be filled before there is a dog to book for.
      inert={waiting}
      className={cn("min-w-0 transition-opacity duration-200", waiting && "opacity-45")}
    >
      <legend className="flex items-baseline gap-3 text-lg font-extrabold">
        {number !== undefined && (
          <span aria-hidden className="text-primary tabular-nums">
            {toPersianDigits(String(number))}
          </span>
        )}
        {title}
      </legend>
      {description && <p className="mt-1 border-b pb-3 text-sm text-pretty text-muted-foreground">{description}</p>}
      {/* Without a description the rule still closes the legend, so the parts look alike. */}
      {!description && <div aria-hidden className="mt-2 border-b" />}
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </fieldset>
  );
}
