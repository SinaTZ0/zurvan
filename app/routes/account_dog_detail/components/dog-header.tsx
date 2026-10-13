import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";

import { DogPhoto } from "~/components/dog-photo";
import { EvaluationStatusBadge } from "~/components/evaluation-status-badge";
import { Link } from "~/components/link";
import { SpeechBubble } from "~/components/speech-bubble";
import { buttonVariants } from "~/components/ui/button";
import { describeDog } from "~/lib/dog-format";
import type { DogStatus } from "~/lib/dog-status";
import type { Dog } from "~/orpc/dog/contract";
import { MedalsRail } from "~/routes/account_dog_detail/components/medals-rail";

/*===== Dog Header =====*/
/**
 * The page's first screen: the dog's photo fills the band's end half and fades into black toward the words, the way the
 * home hero does; the words sit on the dark start half with no box. On phones the photo comes first (16:10) and melts
 * into the black the words stand on.
 *
 * The dog's bubble is the page's one orchestrated moment (`drawIn`). It is visible text, not decoration.
 */
export function DogHeader({ dog, status }: { dog: Dog; status: DogStatus }) {
  // Only a real photo gets the fade into black and the words pulled over its edge: the fallback tag must stay bright and whole.
  const hasPhoto = dog.photo !== null;

  return (
    <header className="relative isolate overflow-hidden rounded-4xl border border-border bg-black">
      {/*===== Photo =====*/}
      {/* The fallback tag box (a dog without a photo) keeps a floor height so the tag never looks squeezed. */}
      <div
        className={cn(
          "relative aspect-16/10 lg:absolute lg:inset-y-0 lg:end-0 lg:aspect-auto lg:min-h-0 lg:w-[52%]",
          hasPhoto ? "min-h-52" : "min-h-56",
        )}
      >
        <DogPhoto
          name={dog.name}
          photo={dog.photo}
          microchipNumber={dog.microchipNumber}
          variant="full"
          priority
          className="size-full"
        />
        {hasPhoto && (
          <>
            {/* Gradients start from the text side only (see the home hero): to the black below on phones, to the black on the
                start side on desktop. */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black to-transparent lg:hidden"
            />
            <div
              aria-hidden
              className="absolute inset-0 hidden bg-linear-to-l from-black from-5% via-black/50 via-35% to-transparent to-75% lg:block"
            />
          </>
        )}
      </div>

      {/*===== Words =====*/}
      <div
        className={cn(
          "relative flex flex-col gap-6 px-5 pt-1 pb-6 sm:px-8 lg:min-h-112 lg:w-[58%] lg:justify-center lg:px-12 lg:py-10",
          hasPhoto && "max-lg:-mt-6",
        )}
      >
        <div>
          <Link
            to="/account"
            className="-ms-1 inline-flex items-center gap-1 rounded-sm px-1 text-sm font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronRightIcon aria-hidden className="size-4" />
            سگ‌های من
          </Link>

          {/*------ Name, Facts, Badge ------*/}
          <h1 className="mt-4 font-display text-h1 font-black text-balance">{dog.name}</h1>
          <p className="mt-1 text-pretty text-muted-foreground">{describeDog(dog)}</p>
          <div className="mt-3">
            {status.badge ? (
              <EvaluationStatusBadge status={status.badge} />
            ) : (
              <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-border px-2.5 text-xs font-bold whitespace-nowrap text-muted-foreground">
                ارزیابی نشده
              </span>
            )}
          </div>
        </div>

        {/*------ Bubble ------*/}
        {/* At the end of the column, nearest the photo, so the tail points back at the dog: up at it on a phone. */}
        <div className="flex flex-col items-end gap-2">
          <SpeechBubble tail="top-end" drawIn className="max-w-[17rem] sm:max-w-xs">
            {status.line}
          </SpeechBubble>
          {status.rejectionReason && (
            <p className="max-w-xs text-sm text-pretty text-muted-foreground">{status.rejectionReason}</p>
          )}
        </div>

        {/*------ Actions ------*/}
        {/* One main action for the state, and the quieter edit beside it; the edit alone while the dog only waits. */}
        <div className="flex flex-wrap gap-3">
          {status.action && (
            <Link to={status.action.to} className={buttonVariants({ size: "lg" })}>
              {status.action.label}
            </Link>
          )}
          <Link to={`/account/dogs/${dog.id}/edit`} className={buttonVariants({ variant: "outline", size: "lg" })}>
            ویرایش مشخصات
          </Link>
        </div>

        {/*------ Medals ------*/}
        <MedalsRail courses={dog.passedCourses} />
      </div>
    </header>
  );
}
