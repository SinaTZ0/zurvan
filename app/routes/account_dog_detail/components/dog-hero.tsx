import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";

import { EvaluationStatusBadge } from "~/components/evaluation-status-badge";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { describeDog } from "~/lib/dog-format";
import type { DogStatus } from "~/lib/dog-status";
import type { Dog } from "~/orpc/dog/contract";
import { COLUMN } from "~/routes/account_dog_detail/column";
import { DogPortrait } from "~/routes/account_dog_detail/components/dog-portrait";

/*===== Dog Hero =====*/
/**
 * The dog's own room, first screen: its name in big gold at the start, its photo pinned as a big taped print at the end
 * (on phones the print comes first, under the way back). The words carry what a customer checks first: how old and
 * heavy, whether it was evaluated, the file number, three numbers (courses in training, courses passed, certificates)
 * and the one thing to do next. The whole hero stands on a strip of path, as Course Detail's does.
 *
 * Load moment: the print drops in (`DogPortrait`), the bubble pops, the numbers rise in one after another.
 */
export function DogHero({
  dog,
  status,
  counts,
}: {
  dog: Dog;
  status: DogStatus;
  counts: { active: number; passed: number; certificates: number };
}) {
  return (
    <section aria-labelledby="dog-name" className="relative isolate">
      <div className={cn(COLUMN, "relative z-10 pt-5 lg:pt-8")}>
        <Link
          to="/account"
          className="-ms-1 inline-flex items-center gap-1 rounded-sm px-1 text-sm font-bold text-muted-foreground outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronRightIcon aria-hidden className="size-4" />
          سگ‌های من
        </Link>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-y-8 pb-10 lg:mt-2 lg:min-h-[26rem] lg:grid-cols-12 lg:gap-x-12 lg:pb-4">
          {/*===== Words =====*/}
          <div className="order-2 lg:order-1 lg:col-span-7 lg:flex lg:flex-col lg:justify-center lg:pb-10">
            <h1
              id="dog-name"
              className="font-display text-[clamp(2.75rem,1.9rem+3.6vw,4.75rem)] leading-[1.1] font-black tracking-tight text-balance text-primary"
            >
              {dog.name}
            </h1>
            <p className="mt-3 text-lead text-pretty text-foreground/85">{describeDog(dog)}</p>

            {/*------ Badge and File Number ------*/}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {status.badge ? (
                <EvaluationStatusBadge status={status.badge} />
              ) : (
                <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-border px-2.5 text-xs font-bold whitespace-nowrap text-muted-foreground">
                  ارزیابی نشده
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                پرونده‌ی{" "}
                <bdi dir="ltr" className="font-mono tracking-wider">
                  {dog.fileNumber}
                </bdi>
              </span>
            </div>

            {/*------ Facts ------*/}
            <dl className="mt-7 grid max-w-xl grid-cols-3 overflow-hidden rounded-2xl border border-border bg-card paper-grain shadow-[0_14px_30px_-20px_rgb(0_0_0/0.9)]">
              <Fact label="دوره در حال آموزش" value={counts.active} delay="0.2s" />
              <Fact label="دوره‌ی گذرونده" value={counts.passed} delay="0.3s" />
              <Fact label="گواهی" value={counts.certificates} delay="0.4s" />
            </dl>

            {/*------ Actions ------*/}
            {/* The state's one main action, and the quieter edit beside it; the edit alone while the dog only waits. */}
            <div className="mt-7 flex flex-wrap gap-3">
              {status.action && (
                <Link {...status.action.link} className={buttonVariants({ variant: "solid", size: "lg" })}>
                  {status.action.label}
                </Link>
              )}
              <Link
                to="/account/dogs/$dogId/edit"
                params={{ dogId: dog.id }}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                ویرایش مشخصات
              </Link>
            </div>
          </div>

          {/*===== Portrait =====*/}
          <div className="order-1 lg:order-2 lg:col-span-5">
            <DogPortrait dog={dog} status={status} />
          </div>
        </div>
      </div>

      {/*===== Ground =====*/}
      {/* Under the grid, which overlaps it a little, so the print's bush stands in the path. Its ends fade out. */}
      <GroundStrip className="-mt-6 h-10 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] md:h-12" />
    </section>
  );
}

/*===== Fact =====*/
/** One number of the strip, big and gold over its label; a zero is a calm dash, not a «۰» that reads as a failing. */
function Fact({ label, value, delay }: { label: string; value: number; delay: string }) {
  return (
    <div className="flex flex-col-reverse gap-1 border-s border-border px-3 py-4 text-center first:border-s-0 sm:px-4">
      <dt className="text-xs leading-snug text-pretty text-muted-foreground sm:text-sm">{label}</dt>
      <dd
        style={{ "--dd-delay": delay } as React.CSSProperties}
        className={cn(
          "dd-num font-display text-3xl leading-none font-black sm:text-4xl",
          value === 0 ? "text-muted-foreground/60" : "text-primary",
        )}
      >
        {value === 0 ? (
          <>
            <span aria-hidden>—</span>
            <span className="sr-only">هیچی</span>
          </>
        ) : (
          formatNumberFa(value)
        )}
      </dd>
    </div>
  );
}
