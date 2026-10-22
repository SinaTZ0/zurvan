import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut } from "~/components/mascot-cut";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { m } from "~/paraglide/messages";
import type { PublicRecord } from "~/orpc/logbook/contract";
import { COLUMN } from "~/routes/logbook/column";
import { RecordStage } from "~/routes/logbook/components/record-stage";

/*===== Public Header =====*/
/**
 * The top of a public record (switched off today: it needs the owner's approved consent wording): the file number, the
 * dog's name as the h1 (gold: it is a name), breed and age, and the line that the owner made the record public. At
 * the end stands the kennel with the mascot sitting beside it, saying the record is his friend's. The mascot is never
 * presented as the record's dog: the record has no photo and the dog may be any breed.
 *
 * Same stage as the lookup's, with the sitting dog in place of the tag dog; the bubble's tail is aimed at his head.
 * The load moment (`lb-*`): the bubble pops from its tail. Off for reduced motion.
 */
export function PublicHeader({ record }: { record: PublicRecord }) {
  const { fileNumber, dog } = record;

  return (
    <section aria-labelledby="logbook-title" className="pt-section-sm pb-section-sm">
      <div className={`${COLUMN} grid gap-y-8 lg:grid-cols-12 lg:gap-x-12`}>
        {/*===== Words =====*/}
        <div className="order-2 lg:order-1 lg:col-span-6 lg:flex lg:flex-col lg:justify-center">
          <p
            dir="ltr"
            className="w-fit rounded-full border border-border bg-card paper-grain px-3 py-1 text-start font-mono text-sm tracking-wider text-muted-foreground"
          >
            {fileNumber}
          </p>
          <h1
            id="logbook-title"
            className={`${DISPLAY_HEADING} mt-4 text-h1 text-balance text-primary lg:text-[3.4rem]`}
          >
            {dog.name}
          </h1>
          {(dog.breed || dog.ageText) && (
            <p className="mt-3 text-lead text-pretty text-muted-foreground">
              {[dog.breed, dog.ageText].filter(Boolean).join(m.logbook_public_separator())}
            </p>
          )}
          <p className="mt-2 text-pretty text-muted-foreground">{m.logbook_public_made_public()}</p>
        </div>

        {/*===== Stage =====*/}
        <RecordStage className="lg:col-span-6">
          <MascotCut
            name="plants"
            eager
            className="lively-sway absolute bottom-(--ground) left-[-3%] w-[15%] translate-y-[6%]"
          />
          <MascotCut
            name="kennel"
            eager
            className="absolute bottom-(--ground) left-[3%] w-[44%] translate-y-[6%] lg:w-[56%]"
          />
          <MascotCut
            name="plants"
            eager
            className="lively-sway-2 absolute right-[-3%] bottom-(--ground) w-[13%] translate-y-[6%] -scale-x-100"
          />

          <div className="absolute bottom-(--ground) left-[58%] h-(--dog-h) -translate-x-1/2 translate-y-[3%]">
            <MascotCut name="sit" eager className="lively-breathe block h-full w-auto" />
          </div>

          <ChalkBubble
            tail="right"
            className="lb-pop absolute right-[calc(42%-2.25rem)] bottom-[calc(var(--ground)+var(--dog-h)+0.6rem)] max-w-[12rem] text-pretty lg:max-w-[15rem]"
          >
            {m.logbook_public_bubble({ name: dog.name })}
          </ChalkBubble>
        </RecordStage>
      </div>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .lb-pop {
            transform-origin: calc(100% - 2.25rem) 100%;
            animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .6s both;
          }
        }
      `}</style>
    </section>
  );
}
