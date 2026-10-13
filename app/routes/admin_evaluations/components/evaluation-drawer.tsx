import { XIcon } from "lucide-react";
import { useState } from "react";

import { CustomerContact } from "~/components/customer-contact";
import { DogThumb } from "~/components/dog-thumb";
import { EvaluationStatusBadge } from "~/components/evaluation-status-badge";
import { Button } from "~/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "~/components/ui/sheet";
import { VideoPlayer } from "~/components/video-player";
import { useIsMobile } from "~/hooks/use-mobile";
import { formatJalaliDate, formatJalaliTimestamp } from "~/lib/jalali";
import {
  EVALUATION_PERIOD_LABELS,
  EVALUATION_PERIODS,
  EVALUATION_WEEKDAY_LABELS,
  EVALUATION_WEEKDAYS,
} from "~/orpc/evaluation/constants";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";
import { PhotoGallery } from "~/routes/admin_evaluations/components/photo-gallery";
import type { AnswerKind } from "~/routes/admin_evaluations/schema";

/*===== Evaluation Drawer =====*/
/**
 * One evaluation in full, for the call: who to ring, when they are free, and their photos and videos. A side sheet on
 * desktop, a bottom sheet on phones. The page finds the evaluation in the whole list (not the filtered one), so after
 * an answer the drawer stays open on the new status even when the filter just hid the row.
 *
 * It is not `ui/drawer`: that positions physically and is wrong in RTL.
 */
export function EvaluationDrawer({
  evaluationId,
  evaluation,
  onClose,
  onAnswer,
}: {
  /** From `?evaluation=`; null means closed. */
  evaluationId: string | null;
  /** The match for the id in the full list; null when the id is unknown. */
  evaluation: AdminEvaluation | null;
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
        className="gap-0 p-0 data-[side=bottom]:max-h-[90dvh] data-[side=bottom]:rounded-t-3xl data-[side=left]:w-full data-[side=left]:sm:max-w-md"
      >
        {current &&
          (current.evaluation ? <DrawerBody evaluation={current.evaluation} onAnswer={onAnswer} /> : <MissingBody />)}
      </SheetContent>
    </Sheet>
  );
}

/*===== Close Button =====*/
function CloseButton() {
  return (
    <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="بستن" className="shrink-0" />}>
      <XIcon aria-hidden />
    </SheetClose>
  );
}

/*===== Unknown Id =====*/
// A link to a request that isn't in the list (an old bookmark, or one deleted with its dog).
function MissingBody() {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <SheetTitle className="text-base font-bold">این درخواست پیدا نشد</SheetTitle>
      <SheetDescription className="sr-only">شناسه‌ی درخواست در فهرست نیست.</SheetDescription>
      <CloseButton />
    </div>
  );
}

/*===== Body =====*/
function DrawerBody({ evaluation, onAnswer }: { evaluation: AdminEvaluation; onAnswer: (kind: AnswerKind) => void }) {
  const { dog, customer, status } = evaluation;
  const days = EVALUATION_WEEKDAYS.filter((day) => evaluation.availableDays.includes(day));
  const periods = EVALUATION_PERIODS.filter((period) => evaluation.availablePeriods.includes(period));
  const noMedia = evaluation.photos.length === 0 && evaluation.videos.length === 0;

  return (
    <>
      {/*===== Header (fixed) =====*/}
      <header className="flex items-center gap-3 border-b border-border p-4">
        <DogThumb name={dog.name} photo={dog.photo} className="size-14" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <SheetTitle className="truncate text-lg font-extrabold">{dog.name}</SheetTitle>
            <EvaluationStatusBadge status={status} />
          </div>
          <SheetDescription className="mt-0.5 text-xs">
            درخواست ارزیابی · {formatJalaliTimestamp(evaluation.createdAt)}
          </SheetDescription>
        </div>
        <CloseButton />
      </header>

      {/*===== Scrolling body =====*/}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
        {/*------ Customer ------*/}
        <div className="rounded-2xl border border-border bg-card p-4">
          <CustomerContact name={customer.name} phoneNumber={customer.phoneNumber} variant="call" />
        </div>

        {/*------ When free ------*/}
        {evaluation.createdByAdmin ? (
          <p className="text-sm text-muted-foreground">ثبت‌شده توسط مدیر</p>
        ) : (
          <section aria-labelledby="drawer-free" className="grid gap-3">
            <h3 id="drawer-free" className="text-sm font-bold">
              کی آزاده؟
            </h3>
            {evaluation.earliestDate && (
              <p className="text-sm text-muted-foreground">از {formatJalaliDate(evaluation.earliestDate)}</p>
            )}
            <Chips labels={days.map((day) => EVALUATION_WEEKDAY_LABELS[day])} />
            <Chips labels={periods.map((period) => EVALUATION_PERIOD_LABELS[period])} />
          </section>
        )}

        {/*------ Photos ------*/}
        {evaluation.photos.length > 0 && (
          <section aria-labelledby="drawer-photos" className="grid gap-3">
            <h3 id="drawer-photos" className="text-sm font-bold">
              عکس‌ها
            </h3>
            <PhotoGallery photos={evaluation.photos} dogName={dog.name} />
          </section>
        )}

        {/*------ Videos ------*/}
        {evaluation.videos.length > 0 && (
          <section aria-labelledby="drawer-videos" className="grid gap-3">
            <h3 id="drawer-videos" className="text-sm font-bold">
              ویدیوها
            </h3>
            {evaluation.videos.map((video) => (
              <VideoPlayer key={video.id} video={video} />
            ))}
          </section>
        )}

        {noMedia && <p className="text-sm text-muted-foreground">عکس یا ویدیویی نفرستاده</p>}

        {/*------ Decision ------*/}
        {evaluation.decidedAt && (
          <p className="text-sm text-muted-foreground">تصمیم: {formatJalaliTimestamp(evaluation.decidedAt)}</p>
        )}
        {status === "rejected" && evaluation.rejectionReason && (
          <div className="rounded-2xl bg-muted p-4 text-sm">
            <p className="mb-1 text-xs font-bold text-muted-foreground">دلیل رد</p>
            <p className="whitespace-pre-wrap" dir="auto">
              {evaluation.rejectionReason}
            </p>
          </div>
        )}
      </div>

      {/*===== Footer (fixed, only while waiting) =====*/}
      {status === "requested" && (
        <footer className="flex gap-2 border-t border-border p-4">
          <Button type="button" variant="solid" className="flex-1" onClick={() => onAnswer("evaluate")}>
            ارزیابی شد
          </Button>
          <Button type="button" variant="outline" onClick={() => onAnswer("reject")}>
            رد
          </Button>
        </footer>
      )}
    </>
  );
}

/*===== Chips =====*/
function Chips({ labels }: { labels: readonly string[] }) {
  if (labels.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {labels.map((label) => (
        <li
          key={label}
          className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs font-bold"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
