import { cn } from "cn";
import { XIcon } from "lucide-react";
import { useState } from "react";

import { CustomerContact } from "~/components/customer-contact";
import { DogThumb } from "~/components/dog-thumb";
import { EvaluationStatusBadge } from "~/components/evaluation-status-badge";
import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "~/components/ui/sheet";
import { VideoPlayer } from "~/components/video-player";
import { useIsMobile } from "~/hooks/use-mobile";
import { ADMIN_TEAR } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { formatJalaliDate, formatJalaliTimestamp } from "~/lib/jalali";
import { normalizeWhenFree } from "~/lib/when-free-format";
import { EVALUATION_PERIOD_LABELS, EVALUATION_WEEKDAY_LABELS } from "~/orpc/evaluation/constants";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";
import { PhotoGallery } from "~/routes/admin_evaluations/components/photo-gallery";
import { describeWaiting } from "~/routes/admin_evaluations/dates";
import { useChanged } from "~/routes/admin_evaluations/hooks/use-changed";
import type { AnswerKind } from "~/routes/admin_evaluations/schema";

/*===== Constants =====*/
/** A section of the drawer's body: the slip's tear above every one but the first. */
const SECTION = cn("grid gap-3 border-t py-5 first:border-t-0 first:pt-0 last:pb-0", ADMIN_TEAR);

/** How an answered request is said in the footer, in his own words. */
const OUTCOMES: Record<Exclude<AdminEvaluation["status"], "requested">, string> = {
  evaluated: "ارزیابی‌اش کردی",
  rejected: "ردش کردی",
  withdrawn: "صاحبش درخواست رو پس گرفت",
};

/*===== Evaluation Drawer =====*/
/**
 * One request in full, for the call: who to ring and when they're free, then their photos and videos, with the two
 * answers in a footer that stays put. A side sheet on desktop, a bottom sheet on phones. The page finds the request in
 * the whole list (not the filtered one), so after an answer the drawer stays open on the new status, whose chip is
 * pressed in, even when the filter just hid the row.
 *
 * It is not `ui/drawer`: that positions physically and is wrong in RTL.
 */
export function EvaluationDrawer({
  evaluationId,
  evaluation,
  footerRef,
  onClose,
  onAnswer,
}: {
  /** From `?evaluation=`; null means closed. */
  evaluationId: string | null;
  /** The match for the id in the full list; null when the id is unknown. */
  evaluation: AdminEvaluation | null;
  /** The footer, where focus lands after an answer (its buttons are replaced by the outcome). */
  footerRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onAnswer: (kind: AnswerKind) => void;
}) {
  const isMobile = useIsMobile();

  // While the sheet fades out the id is already gone from the URL: keep drawing the last one instead of flashing the
  // "not found" body. Set during render (not in an effect) so there is no frame with stale content.
  const [last, setLast] = useState<{ id: string; evaluation: AdminEvaluation | null } | null>(null);
  if (evaluationId !== null && (last?.id !== evaluationId || last.evaluation !== evaluation)) {
    setLast({ id: evaluationId, evaluation });
  }
  const current = evaluationId === null ? last : { evaluation };

  return (
    <Sheet open={evaluationId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "left"}
        showCloseButton={false}
        className="gap-0 border-foreground/10 paper-grain p-0 data-[side=bottom]:max-h-[90dvh] data-[side=bottom]:rounded-t-3xl data-[side=left]:w-full data-[side=left]:sm:max-w-md"
      >
        {current &&
          (current.evaluation ? (
            // Keyed by the request, so opening another one never "changes" a status and stamps it.
            <DrawerBody
              key={current.evaluation.id}
              evaluation={current.evaluation}
              footerRef={footerRef}
              onAnswer={onAnswer}
            />
          ) : (
            <MissingBody />
          ))}
      </SheetContent>
    </Sheet>
  );
}

/*===== Close Button =====*/
function CloseButton() {
  return (
    <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="بستن" className="-me-1 shrink-0" />}>
      <XIcon aria-hidden />
    </SheetClose>
  );
}

/*===== Unknown Id =====*/
// A link to a request that isn't in the list (an old bookmark, or one deleted with its dog).
function MissingBody() {
  return (
    <div className="flex items-start justify-between gap-3 p-5">
      <div>
        <SheetTitle className={cn(DISPLAY_HEADING, "text-xl")}>این درخواست پیدا نشد</SheetTitle>
        <SheetDescription className="mt-1.5">شاید سگش پاک شده باشه. از فهرست یکی دیگه رو باز کن.</SheetDescription>
      </div>
      <CloseButton />
    </div>
  );
}

/*===== Body =====*/
function DrawerBody({
  evaluation,
  footerRef,
  onAnswer,
}: {
  evaluation: AdminEvaluation;
  footerRef: React.RefObject<HTMLElement | null>;
  onAnswer: (kind: AnswerKind) => void;
}) {
  const { dog, customer, status } = evaluation;
  const requested = status === "requested";
  const statusChanged = useChanged(status);
  const noMedia = evaluation.photos.length === 0 && evaluation.videos.length === 0;

  return (
    <>
      {/*===== Head (fixed) =====*/}
      <header className={cn("flex items-start gap-4 border-b-2 p-5", ADMIN_TEAR)}>
        <DogThumb name={dog.name} photo={dog.photo} className="size-14" />
        <div className="min-w-0 flex-1">
          {/* The dog's name opens its page (F2). The row behind the drawer is a stretched link, so the link lives here. */}
          <SheetTitle className={cn(DISPLAY_HEADING, "text-xl break-words")}>
            <Link
              to="/admin/dogs/$dogId"
              params={{ dogId: dog.id }}
              className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <bdi>{dog.name}</bdi>
            </Link>
          </SheetTitle>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <EvaluationStatusBadge key={status} status={status} className={cn(statusChanged && "ev-chip-stamp")} />
            <SheetDescription className="text-xs">
              درخواست {formatJalaliTimestamp(evaluation.createdAt)}
              {requested && !evaluation.createdByAdmin && `، ${describeWaiting(evaluation.createdAt)}`}
            </SheetDescription>
          </div>
        </div>
        <CloseButton />
      </header>

      {/*===== Scrolling Body =====*/}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
        {/*------ Who to Call ------*/}
        <section aria-labelledby="drawer-customer" className={SECTION}>
          <h3 id="drawer-customer" className="sr-only">
            صاحبش
          </h3>
          <CustomerContact name={customer.name} phoneNumber={customer.phoneNumber} variant="call" />
          {evaluation.createdByAdmin ? (
            <p className="text-sm text-muted-foreground">ثبت‌شده توسط مدیر، بدون درخواست</p>
          ) : (
            <WhenFree evaluation={evaluation} />
          )}
        </section>

        {/*------ Photos ------*/}
        {evaluation.photos.length > 0 && (
          <section aria-labelledby="drawer-photos" className={SECTION}>
            <h3 id="drawer-photos" className="text-sm font-bold">
              عکس‌ها{" "}
              <span className="font-normal text-muted-foreground">{formatNumberFa(evaluation.photos.length)}</span>
            </h3>
            <PhotoGallery photos={evaluation.photos} dogName={dog.name} />
          </section>
        )}

        {/*------ Videos ------*/}
        {evaluation.videos.length > 0 && (
          <section aria-labelledby="drawer-videos" className={SECTION}>
            <h3 id="drawer-videos" className="text-sm font-bold">
              ویدیوها{" "}
              <span className="font-normal text-muted-foreground">{formatNumberFa(evaluation.videos.length)}</span>
            </h3>
            {evaluation.videos.map((video) => (
              <VideoPlayer key={video.id} video={video} className="border-foreground/15" />
            ))}
          </section>
        )}

        {noMedia && (
          <section className={SECTION}>
            <p className="text-sm text-muted-foreground">عکس یا ویدیویی نفرستاده.</p>
          </section>
        )}
      </div>

      {/*===== Footer (fixed) =====*/}
      {/* Focus lands here after an answer, so a screen reader hears the outcome that replaced the buttons. */}
      <footer
        ref={footerRef}
        tabIndex={-1}
        className={cn(
          "border-t-2 bg-popover p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none",
          ADMIN_TEAR,
        )}
      >
        {requested ? (
          <div className="flex gap-2">
            <Button type="button" variant="solid" className="h-11 flex-1 md:h-10" onClick={() => onAnswer("evaluate")}>
              ارزیابی شد
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 border-foreground/15 bg-transparent px-6 text-destructive md:h-10 dark:bg-transparent"
              onClick={() => onAnswer("reject")}
            >
              رد
            </Button>
          </div>
        ) : (
          <Outcome key={status} evaluation={evaluation} arrived={statusChanged} />
        )}
      </footer>
    </>
  );
}

/*===== When Free =====*/
/** When the customer said they're usually free, as a short definition list; lines they left empty are left out. */
function WhenFree({ evaluation }: { evaluation: AdminEvaluation }) {
  const { days, periods } = normalizeWhenFree({
    days: evaluation.availableDays,
    periods: evaluation.availablePeriods,
  });
  const lines = [
    evaluation.earliestDate && { term: "از", value: formatJalaliDate(evaluation.earliestDate) },
    days.length > 0 && { term: "روزها", value: days.map((day) => EVALUATION_WEEKDAY_LABELS[day]).join("، ") },
    periods.length > 0 && {
      term: "وقت روز",
      value: periods.map((period) => EVALUATION_PERIOD_LABELS[period]).join("، "),
    },
  ].filter((line): line is { term: string; value: string } => !!line);

  if (lines.length === 0) return <p className="text-sm text-muted-foreground">نگفته کی آزاده.</p>;

  return (
    <div className="grid gap-2">
      <h4 className="text-sm font-bold">کی آزاده؟</h4>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-1.5 text-sm">
        {lines.map((line) => (
          <div key={line.term} className="contents">
            <dt className="text-muted-foreground">{line.term}</dt>
            <dd className="text-pretty">{line.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/*===== Outcome =====*/
/**
 * An answered request's footer: what happened and when, and the reason he gave for a rejection, quoted as the customer
 * read it in their SMS. `arrived` is set when he answered while the drawer was open, so the outcome rises in where the
 * buttons were.
 */
function Outcome({ evaluation, arrived }: { evaluation: AdminEvaluation; arrived: boolean }) {
  if (evaluation.status === "requested") return null;

  return (
    <div className={cn("grid gap-3", arrived && "answer-in [--answer-delay:.12s]")}>
      <p className="text-sm">
        <span className="font-bold">{OUTCOMES[evaluation.status]}</span>
        {evaluation.decidedAt && (
          <span className="text-muted-foreground">، {formatJalaliTimestamp(evaluation.decidedAt)}</span>
        )}
      </p>
      {evaluation.status === "rejected" && evaluation.rejectionReason && (
        <blockquote
          className="max-h-32 overflow-y-auto border-s-2 border-foreground/25 ps-3 text-sm leading-6 whitespace-pre-wrap text-foreground/85"
          dir="auto"
        >
          {evaluation.rejectionReason}
        </blockquote>
      )}
    </div>
  );
}
