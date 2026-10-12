import { cn } from "cn";

import { toPersianDigits } from "~/lib/digits";

/*===== Request Part =====*/
/**
 * One numbered part of the request sheet. The numbers are a sequence here (the form is filled top to bottom), and the
 * part is ruled, like the booking sheet. `waiting` dims it and takes it out of the tab order until the dog is chosen.
 */
export function RequestPart({
  number,
  title,
  description,
  waiting = false,
  partRef,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  waiting?: boolean;
  partRef?: React.Ref<HTMLFieldSetElement>;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      ref={partRef}
      // `inert` also blocks focus and clicks, so a dimmed part can't be filled before there is a dog to send about.
      inert={waiting}
      className={cn("min-w-0 transition-opacity duration-200", waiting && "opacity-45")}
    >
      <legend className="flex items-baseline gap-3 text-lg font-extrabold">
        <span aria-hidden className="text-primary tabular-nums">
          {toPersianDigits(String(number))}
        </span>
        {title}
      </legend>
      {description ? (
        <p className="mt-1 border-b pb-3 text-sm text-pretty text-muted-foreground">{description}</p>
      ) : (
        <div aria-hidden className="mt-2 border-b" />
      )}
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </fieldset>
  );
}
