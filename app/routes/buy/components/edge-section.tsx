import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";
import { PLATE } from "~/routes/buy/plate";

/*===== Edge Section =====*/
/**
 * One list on the page: its heading and plain line at the start, and under them the grained plate with the center's
 * dog standing on its top edge at the end corner (`dog`, an `EdgeDog` the caller builds with its scenery and bubble).
 * The heading sits beside the dog, so the band above the plate is his and the words', not an empty strip; its end
 * padding is wider than the dog, his scenery and his bubble, so nothing runs under them.
 *
 * `delay` staggers the section's arrival after a pick (`answer-in`, keyed by the caller); `arrive` is false on load.
 */
export function EdgeSection({
  titleId,
  title,
  description,
  dog,
  arrive,
  delay = 0,
  className,
  children,
}: {
  titleId: string;
  title: React.ReactNode;
  description: React.ReactNode;
  dog: React.ReactNode;
  arrive: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={titleId}
      // Room above the heading for the dog, who stands taller than it on the plate's edge.
      className={cn("pt-12 sm:pt-16 lg:pt-14", arrive && "answer-in", className)}
      style={arrive ? ({ "--answer-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {/*------ Heading ------*/}
      <header className="pe-[9.5rem] pb-5 sm:pe-[17rem] lg:pe-[25rem]">
        <h2 id={titleId} className={cn(DISPLAY_HEADING, "text-h2 text-balance")}>
          {title}
        </h2>
        <p className="mt-2 max-w-xl text-pretty text-muted-foreground">{description}</p>
      </header>

      {/*------ Plate ------*/}
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute end-3 bottom-[calc(100%-3px)] z-10 sm:end-8 lg:end-12">
          {dog}
        </div>
        <div className={cn(PLATE, "p-3 sm:p-6 lg:p-8")}>{children}</div>
      </div>
    </section>
  );
}
