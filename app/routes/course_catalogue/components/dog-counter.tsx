import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut } from "~/components/mascot-cut";
import { formatNumber } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";

/*===== Query in a Sentence =====*/
// The query is the visitor's own text, shown as typed in `bdi`, so a Latin search like «CGC» doesn't reorder the
// Persian around it (nor a Persian one the English). A message can't hold markup, so it is written with a mark where
// the query goes, and the mark is swapped here for the isolated text.
const QUERY_MARK = "\u0001";

function WithQuery({ text, query }: { text: (mark: string) => string; query: string }) {
  const [before = "", after = ""] = text(QUERY_MARK).split(QUERY_MARK);
  return (
    <>
      {before}
      <bdi>{query}</bdi>
      {after}
    </>
  );
}

/*===== Counter Line =====*/
/** What the dog says about the list on screen. */
function CounterLine({ total, query, familyLabel }: { total: number; query: string; familyLabel: string | null }) {
  /*------ Nothing Found ------*/
  if (total === 0) {
    return query ? (
      <WithQuery text={(mark) => m.course_catalogue_counter_none_query({ query: mark })} query={query} />
    ) : (
      <>{m.course_catalogue_counter_none()}</>
    );
  }

  const count = formatNumber(total);

  /*------ A Search ------*/
  if (query) {
    return (
      <WithQuery
        text={(mark) =>
          total === 1
            ? m.course_catalogue_counter_query_one({ query: mark })
            : m.course_catalogue_counter_query_other({ query: mark, count })
        }
        query={query}
      />
    );
  }

  /*------ One Family ------*/
  if (familyLabel) {
    return (
      <>
        {total === 1
          ? m.course_catalogue_counter_family_one({ family: familyLabel })
          : m.course_catalogue_counter_family_other({ family: familyLabel, count })}
      </>
    );
  }

  /*------ Everything ------*/
  return <>{m.course_catalogue_counter_all({ count })}</>;
}

/*===== Dog Counter =====*/
/**
 * The page's one idea: the mascot peeks over the filter shelf and counts the courses for you. His bubble is the live
 * result counter, announced politely whenever the list changes.
 *
 * The `peek` cut-out ends in a flat cut under his chin with his paws hanging below it, so the block ends on the shelf's
 * top edge (the shelf follows the header with nothing between) and the dog is sunk by the paws' length: his chin rests
 * on the wall's coping and his paws hang over its face. Higher, the gap between his chin and the coping shows as a box.
 * The bushes are raised by as much, so they stand on the coping. Phones put the bubble beside the dog; from `md` it sits
 * above him. The tail is on the end side, where he is (the left in RTL, the right in LTR).
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
    <div className="flex items-end justify-between gap-1 md:flex-col md:items-end md:gap-4">
      {/*------ Bubble ------*/}
      {/* The long words of a long query break instead of widening the bubble. On phones it sits up beside his head. */}
      <output aria-live="polite" className="mb-10 block min-w-0 md:mb-0">
        {/* It pops from its tail once he is up; after that only the words change, fading in (a new key each time). */}
        <ChalkBubble
          tail="end"
          className="answer-pop max-w-[15rem] [--answer-delay:0.85s] [--pop-origin:1.75rem_100%] md:max-w-[19rem] lg:max-w-[21rem] ltr:[--pop-origin:calc(100%-1.75rem)_100%]"
        >
          <span key={`${total}|${query}|${familyLabel}`} className="answer-in block [overflow-wrap:anywhere]">
            <CounterLine total={total} query={query} familyLabel={familyLabel} />
          </span>
        </ChalkBubble>
      </output>

      {/*------ Dog ------*/}
      {/* He looks over the wall from a little garden: a bush on each side, as on the home hero's wall, and a pool of
          warm light behind his head. The end side's bush waits for `md`, where he moves in from the column's edge to
          leave it room; on phones the start side's bush is smaller, under the bubble. */}
      <div aria-hidden className="relative z-10 w-28 shrink-0 translate-y-[11%] md:me-12 md:w-52 lg:me-16 lg:w-72">
        <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_45%_45%_at_50%_40%,rgb(255_194_26/0.07),transparent)]" />
        <MascotCut name="plants" eager className="lively-sway absolute bottom-[12%] left-[70%] w-[38%] md:w-[48%]" />
        <MascotCut
          name="plants"
          eager
          className="lively-sway-2 absolute right-[74%] bottom-[12%] hidden w-[38%] -scale-x-100 md:block"
        />
        <MascotCut name="peek" eager className="cc-peek relative block w-full" />
      </div>

      {/* The page's one load moment: he climbs up from behind the wall. The clip moves with him so nothing shows
          below the coping (89% down the picture) until he is up; then his paws come over it and he breathes (the
          shared lively-breathe, second in the list so it wins once it starts). Off for reduced motion. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .cc-peek {
            transform-origin: 50% 100%;
            animation: cc-peek .85s cubic-bezier(.2,.8,.25,1) .15s both, lively-breathe 2.6s ease-in-out 1.2s infinite;
          }
        }
        @keyframes cc-peek {
          0% { transform: translateY(90%); clip-path: inset(-30% -30% 101% -30%); }
          75% { transform: translateY(-3%); clip-path: inset(-30% -30% 8% -30%); }
          88% { transform: none; clip-path: inset(-30% -30% 11% -30%); }
          100% { transform: none; clip-path: inset(-30% -30% -10% -30%); }
        }
      `}</style>
    </div>
  );
}
