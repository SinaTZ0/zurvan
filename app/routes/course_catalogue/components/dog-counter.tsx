import { SpeechBubble } from "~/components/speech-bubble";
import { formatNumberFa } from "~/lib/digits";

/*===== Counter Line =====*/
/**
 * What the dog says about the list on screen. The query is shown as typed, in `bdi`, so a Latin search like «CGC» doesn't
 * reorder the Persian around it.
 */
function CounterLine({ total, query, familyLabel }: { total: number; query: string; familyLabel: string | null }) {
  /*------ Nothing Found ------*/
  if (total === 0) {
    return query ? (
      <>
        «<bdi>{query}</bdi>» رو بلد نیستم! اسم دیگه‌ای امتحان کن.
      </>
    ) : (
      <>چیزی پیدا نکردم! اسم دیگه‌ای امتحان کن.</>
    );
  }

  const count = total === 1 ? "یه" : formatNumberFa(total);

  /*------ A Search ------*/
  if (query) {
    return (
      <>
        برای «<bdi>{query}</bdi>» {count} دوره پیدا کردم.
      </>
    );
  }

  /*------ One Family ------*/
  if (familyLabel)
    return (
      <>
        {count} دوره‌ی «{familyLabel}» دارم.
      </>
    );

  /*------ Everything ------*/
  return <>{formatNumberFa(total)} تا دوره دارم! یکی رو انتخاب کن.</>;
}

/*===== Dog Counter =====*/
/**
 * The page's one idea: the stock cut-out dog looks over the filter shelf and counts the courses for you. Its bubble is
 * the live result counter, announced politely whenever the list changes.
 *
 * The photo is cropped to its top part, so the dog ends exactly on the shelf's top edge (the shelf follows this block
 * with nothing between) as if it stood behind a counter. Phones put the bubble beside the dog; from `md` it sits above.
 *
 * `drawIn` is for the first load only: the bubble stays mounted while the words change, so the chalk outline isn't drawn
 * again, only the text swaps.
 */
export function DogCounter({
  total,
  query,
  familyLabel,
}: {
  total: number;
  /** The query the list was filtered with, trimmed. */
  query: string;
  /** The label of the chosen family, `null` for all. */
  familyLabel: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-2 md:flex-col md:items-end md:gap-7">
      {/*------ Bubble ------*/}
      {/* The tail leaves the bottom edge toward the end, where the dog's face is. The long words of a long query break
          instead of widening the bubble. */}
      <output aria-live="polite" className="block min-w-0">
        <SpeechBubble tail="bottom-end" drawIn className="max-w-[15.5rem] md:max-w-[19rem] lg:max-w-[21rem]">
          <span className="[overflow-wrap:anywhere]">
            <CounterLine total={total} query={query} familyLabel={familyLabel} />
          </span>
        </SpeechBubble>
      </output>

      {/*------ Dog ------*/}
      {/* 640×630 is the top 72% of the 640×879 cut-out: head, ears and the top of the bandana. */}
      <div className="relative aspect-[640/630] w-32 shrink-0 overflow-hidden sm:w-40 md:w-44 lg:w-72">
        <img
          src="/photo/home/eval-dog-640.webp"
          alt="ژرمن‌شپردی با عینک آفتابی و دستمال‌گردن زرد که با دهان باز می‌خندد"
          width={640}
          height={879}
          decoding="async"
          className="absolute inset-x-0 top-0 h-auto w-full"
        />
      </div>
    </div>
  );
}
