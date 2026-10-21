import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { GroundStrip } from "~/components/ground-strip";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { formatNumberFa } from "~/lib/digits";
import { GroupArt, GroupFiller } from "~/routes/help/components/group-art";
import type { FaqGroupData } from "~/routes/help/faq-data";

/*===== FAQ Group =====*/
/**
 * One group of questions: the road step's disc and the dog's heading on a small stage with the step's dog, then the
 * accordion. The disc fills gold while the group (or one of its questions) is the URL's fragment target, so the reader
 * sees where the road just led them; that is pure CSS (`:target`), no script.
 *
 * Desktop: the stage sticks at the start while the long accordion scrolls past. The stage stays in the grid's flow, so
 * the row is never shorter than it: a group whose accordion is shorter than the stage keeps the stage's height and the
 * next group (a margin below) can't start beside the dog. The leftover under such an accordion is the stage's path
 * carried on (`GroupFiller`). Phones: the stage is a slim row (disc, heading, a small dog), then the accordion.
 */
export function FaqGroup({
  group,
  openIds,
  onChange,
}: {
  group: FaqGroupData;
  /** Open question ids across the whole page; only this group's are passed to its accordion. */
  openIds: readonly string[];
  onChange: (args: { groupQuestionIds: readonly string[]; next: readonly string[] }) => void;
}) {
  const titleId = `${group.id}-title`;
  const groupQuestionIds = group.questions.map((question) => question.id);

  return (
    // A margin, not padding, separates groups: the anchor jump then lands on the heading, not on empty space.
    <section
      id={group.id}
      aria-labelledby={titleId}
      className="group/faq mt-section-sm scroll-mt-24 lg:grid lg:grid-cols-12 lg:gap-x-12"
    >
      {/*===== Stage: Disc, Heading and Dog =====*/}
      <div className="relative flex items-center gap-3 lg:sticky lg:top-24 lg:col-span-4 lg:block lg:min-h-48 lg:self-start">
        {/* Wide: the path he stands on runs under the whole stage, fading out at both ends like every path on the site; the
            filler under a short accordion carries it on. */}
        <GroundStrip className="absolute inset-x-0 bottom-0 hidden h-9 [mask-image:linear-gradient(to_right,transparent,black_10%,black_88%,transparent)] lg:block" />

        {/*------ Disc and Heading ------*/}
        {/* Wide: the heading keeps clear of the dog (`pe-40` is the art box's width). */}
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:flex-col lg:items-start lg:gap-3 lg:pe-44 lg:pb-12">
          {group.step !== null && (
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-primary bg-background font-display text-lg font-black text-primary transition-colors group-target/faq:bg-primary group-target/faq:text-primary-foreground group-has-[:target]/faq:bg-primary group-has-[:target]/faq:text-primary-foreground"
            >
              {formatNumberFa(group.step)}
            </span>
          )}
          <h2 id={titleId} className={`${DISPLAY_HEADING} text-lg text-balance sm:text-xl lg:text-[1.375rem]`}>
            {group.title}
          </h2>
        </div>

        {/*------ The Step's Dog ------*/}
        <GroupArt groupId={group.id} />
      </div>

      {/*===== Questions =====*/}
      <div className="mt-6 flex flex-col lg:col-span-8 lg:mt-0">
        <Accordion
          multiple
          hiddenUntilFound
          value={openIds.filter((id) => groupQuestionIds.includes(id))}
          onValueChange={(next) => onChange({ groupQuestionIds, next: next as string[] })}
          className="border-t border-border"
        >
          {group.questions.map((question) => (
            <AccordionItem key={question.id} value={question.id} id={question.id} className="scroll-mt-24 border-b">
              <AccordionTrigger className="min-h-14 items-center gap-4 px-2 py-4 text-base font-extrabold hover:no-underline hover:**:data-[slot=accordion-trigger-icon]:text-primary focus-visible:**:data-[slot=accordion-trigger-icon]:text-primary">
                {question.question}
              </AccordionTrigger>
              <AccordionContent className="max-w-prose px-2 pb-6 text-base leading-8 text-pretty text-muted-foreground transition-[height] duration-200 motion-reduce:transition-none [&_a]:text-primary [&_a]:hover:text-primary">
                {question.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/*------ The Path Goes On ------*/}
        <GroupFiller groupId={group.id} />
      </div>
    </section>
  );
}
