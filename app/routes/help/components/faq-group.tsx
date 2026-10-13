import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { formatNumberFa } from "~/lib/digits";
import type { FaqGroupData } from "~/routes/help/faq-data";

/*===== FAQ Group =====*/
/**
 * One group of questions: the road step's disc and the dog's heading, then the accordion. The disc fills gold while the
 * group (or one of its questions) is the URL's fragment target, so the reader sees where the road just led them; that is
 * pure CSS (`:target`), no script.
 *
 * Desktop: the disc and heading stick at the start while the long accordion scrolls past; phones stack them.
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
      className="group/faq mt-section-md scroll-mt-24 lg:grid lg:grid-cols-12 lg:gap-x-12"
    >
      {/*===== Disc and Heading =====*/}
      <div className="flex items-center gap-4 lg:sticky lg:top-24 lg:col-span-4 lg:flex-col lg:items-start lg:gap-5 lg:self-start">
        {group.step !== null && (
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-primary bg-background font-display text-lg font-black text-primary transition-colors group-target/faq:bg-primary group-target/faq:text-primary-foreground group-has-[:target]/faq:bg-primary group-has-[:target]/faq:text-primary-foreground"
          >
            {formatNumberFa(group.step)}
          </span>
        )}
        <h2 id={titleId} className="font-display text-h2 font-black text-balance">
          {group.title}
        </h2>
      </div>

      {/*===== Questions =====*/}
      <Accordion
        multiple
        hiddenUntilFound
        value={openIds.filter((id) => groupQuestionIds.includes(id))}
        onValueChange={(next) => onChange({ groupQuestionIds, next: next as string[] })}
        className="mt-6 border-t border-border lg:col-span-8 lg:mt-0"
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
    </section>
  );
}
