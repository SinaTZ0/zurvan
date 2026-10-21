import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRevalidator } from "react-router";

import { cn } from "cn";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { PublicRecordConsent } from "~/lib/public-record";
import { orpc } from "~/orpc/client";
import type { PublicStatus } from "~/orpc/logbook/contract";
import { useChanged } from "~/routes/account_dog_detail/components/use-changed";
import { PLATE } from "~/routes/account_dog_detail/plate";

/*===== Public Record Card =====*/
/**
 * The choice to make the dog's record public (docs/app-spec.md, F14), shown **only when approved consent wording exists**
 * (`status.available`): the wording as written, a plain list of what a stranger would see and what never shows, a tick to
 * agree, and one button. Turning it back to private is one press and takes effect at once. The server records the
 * agreement with the wording's version and the time; nothing is sent from here but «public» or «private».
 *
 * A grained plate like the rest of the side column. After a press the state's words arrive (`answer-in`, keyed by the
 * state) instead of switching in place.
 */
export function PublicRecordCard({
  dogId,
  dogName,
  status,
  wording,
}: {
  dogId: string;
  dogName: string;
  status: PublicStatus;
  /** The approved wording to show; present whenever `status.available`. */
  wording: PublicRecordConsent | null;
}) {
  const revalidator = useRevalidator();
  const [agreed, setAgreed] = useState(false);
  const changed = useChanged(status.isPublic);
  const setPublic = useMutation({
    ...orpc.logbook.setPublic.mutationOptions(),
    onSuccess: async (next) => {
      toast.add({ title: next.isPublic ? "پرونده عمومی شد." : "پرونده دوباره خصوصی شد.", type: "success" });
      setAgreed(false);
      await revalidator.revalidate();
    },
  });

  if (!status.available || !wording) return null;

  return (
    <section aria-labelledby="public-record-title" className={cn(PLATE, "flex flex-col gap-4 p-5 sm:p-6")}>
      <h2 id="public-record-title" className="font-display text-xl font-extrabold">
        پرونده‌ی عمومی {dogName}
      </h2>

      {status.isPublic ? (
        <div key="public" className={cn("flex flex-col gap-4", changed && "answer-in")}>
          <p className="text-sm text-pretty text-muted-foreground">
            پرونده الان عمومیه
            {status.since ? ` (از ${formatJalaliTimestamp(status.since)})` : ""}. هر کی QR یا شماره‌ی پرونده رو داشته
            باشه، اینایی که پایین نوشته رو می‌بینه. هر وقت خواستی خصوصی‌ش کن.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={setPublic.isPending}
            onClick={() => setPublic.mutate({ dogId, isPublic: false })}
          >
            {setPublic.isPending && <Spinner aria-hidden />}
            دوباره خصوصی کن
          </Button>
        </div>
      ) : (
        <div key="private" className={cn("flex flex-col gap-4", changed && "answer-in")}>
          <div className="flex flex-col gap-2 text-sm text-pretty">
            <p className="font-bold">{wording.title}</p>
            {wording.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="public-record-agree"
              checked={agreed}
              onCheckedChange={(next) => setAgreed(next)}
              className="mt-1"
            />
            <Label htmlFor="public-record-agree" className="text-sm leading-relaxed font-medium text-pretty">
              متن بالا رو خوندم و قبول دارم.
            </Label>
          </div>
          <Button
            type="button"
            disabled={!agreed || setPublic.isPending}
            onClick={() => setPublic.mutate({ dogId, isPublic: true })}
          >
            {setPublic.isPending && <Spinner aria-hidden />}
            پرونده رو عمومی کن
          </Button>
        </div>
      )}

      <FormAlert message={setPublic.isError ? "انجام نشد. دوباره امتحان کن." : undefined} />

      <div className="grid gap-3 border-t border-dashed border-foreground/15 pt-4 text-sm sm:grid-cols-2">
        <div>
          <p className="font-bold">اینا دیده می‌شه</p>
          <ul className="mt-1 list-disc ps-5 text-muted-foreground">
            <li>اسم، نژاد و سن سگ</li>
            <li>دوره‌های تمام‌شده</li>
            <li>گواهی‌های معتبر</li>
            <li>جلسه‌هایی که {HEAD_TRAINER.firstName} «قابل نمایش» علامت زده</li>
          </ul>
        </div>
        <div>
          <p className="font-bold">اینا هیچ‌وقت دیده نمی‌شه</p>
          <ul className="mt-1 list-disc ps-5 text-muted-foreground">
            <li>اسم و شماره‌ی تو</li>
            <li>پرداخت‌ها</li>
            <li>وزن، میکروچیپ، یادداشت‌های رفتاری و پزشکی</li>
            <li>عکس و فیلم</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
