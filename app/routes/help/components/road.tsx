import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Stops =====*/
// The real path from a new dog to the next course (app-spec F3 to F6). It is a sequence, so it is numbered, and each stop
// is the start of the FAQ group with the same number (`faq-data.tsx`).
const STOPS = [
  { id: "evaluation", title: "ارزیابی رایگان", line: `${HEAD_TRAINER.firstName} سگت رو می‌بینه.` },
  { id: "courses", title: "دوره‌ها باز می‌شن", line: "اونایی که پیش‌نیازشون رو گذرونده." },
  { id: "paying", title: "انتخاب و خرید", line: "دوره‌ات رو از سبد برمی‌داری." },
  { id: "training", title: "تماس و تمرین", line: `${HEAD_TRAINER.firstName} زنگ می‌زنه و هماهنگ می‌کنید.` },
  { id: "done", title: "تموم شد", line: "دوره‌ی بعدی باز می‌شه." },
];

/*===== Road =====*/
/**
 * The five stops from the free evaluation to a finished course, joined by a hand-drawn dashed chalk line. It answers
 * "how does buying work here?" at a glance and is also the index of the FAQ below.
 *
 * Desktop: five equal columns, the line running through the disc centres and the words under each disc. Phones: the
 * same stops in a column, the line down the discs' start side and the words beside them.
 *
 * The stops are plain `<a href="#…">`, not the router's `Link`: a native fragment jump is what sets `:target`, which
 * fills the group's disc below.
 */
export function Road() {
  return (
    <section aria-label="مراحل از ارزیابی تا تموم شدن دوره" className="border-y border-border bg-sunken">
      <ol className="site-container grid gap-y-8 py-10 md:grid-cols-5 md:gap-x-4 md:py-14">
        {STOPS.map((stop, index) => {
          const isLast = index === STOPS.length - 1;

          return (
            <li key={stop.id} className="relative">
              {/*------ Chalk Line ------*/}
              {/* One segment per stop, drawn from this stop's disc to the next one's; the opaque discs hide the ends.
                  Phones: down from the disc's centre. Desktop: from the column's centre toward the end side. The
                  stroke is `non-scaling` so the dashes keep their size however far the segment stretches. */}
              {!isLast && (
                <>
                  <svg
                    aria-hidden
                    viewBox="0 0 6 100"
                    preserveAspectRatio="none"
                    className="absolute start-[19px] top-6 -bottom-8 w-1.5 text-chalk/45 md:hidden"
                  >
                    <path
                      d="M3 0 C1 14 5 28 3 42 C1 56 5 70 3 84 C2.5 90 3.5 95 3 100"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="7 9"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <svg
                    aria-hidden
                    viewBox="0 0 100 6"
                    preserveAspectRatio="none"
                    className="absolute start-1/2 top-[19px] hidden h-1.5 w-full text-chalk/45 md:block"
                  >
                    <path
                      d="M0 3 C14 1 28 5 42 3 C56 1 70 5 84 3 C90 2.5 95 3.5 100 3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="7 9"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </>
              )}

              {/*------ Stop ------*/}
              <a
                href={`#${stop.id}`}
                className="group/stop relative flex gap-4 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:flex-col md:items-center md:gap-3 md:text-center"
              >
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-primary bg-sunken font-display text-lg font-black text-primary transition-colors group-hover/stop:bg-primary group-hover/stop:text-primary-foreground group-focus-visible/stop:bg-primary group-focus-visible/stop:text-primary-foreground"
                >
                  {formatNumberFa(index + 1)}
                </span>
                <span className="block pt-1 md:pt-0">
                  <span className="block font-extrabold">{stop.title}</span>
                  <span className="mt-1 block text-sm text-pretty text-muted-foreground">{stop.line}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
