import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { PublicRecordConsent } from "~/lib/public-record";
import { orpc } from "~/orpc/client";
import type { PublicStatus } from "~/orpc/logbook/contract";

/*===== Public Record Card =====*/
/**
 * The choice to make the dog's record public (docs/app-spec.md, F14), shown **only when approved consent wording exists**
 * (`status.available`): the wording as written, a plain list of what a stranger would see and what never shows, a tick to
 * agree, and one button. Turning it back to private is one press and takes effect at once. The server records the
 * agreement with the wording's version and the time; nothing is sent from here but «public» or «private».
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
    <section
      aria-labelledby="public-record-title"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <h2 id="public-record-title" className="text-lg font-extrabold">
        پرونده‌ی عمومی {dogName}
      </h2>

      {status.isPublic ? (
        <>
          <p className="text-sm text-pretty text-muted-foreground">
            پرونده الان عمومیه
            {status.since ? ` (از ${formatJalaliTimestamp(status.since)})` : ""}. هر کس QR یا شماره‌ی پرونده را داشته
            باشد، موارد زیر را می‌بیند. هر وقت خواستی خصوصی‌اش کن.
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
        </>
      ) : (
        <>
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
              متن بالا را خواندم و می‌پذیرم.
            </Label>
          </div>
          <Button
            type="button"
            disabled={!agreed || setPublic.isPending}
            onClick={() => setPublic.mutate({ dogId, isPublic: true })}
          >
            {setPublic.isPending && <Spinner aria-hidden />}
            پرونده را عمومی کن
          </Button>
        </>
      )}

      <FormAlert message={setPublic.isError ? "انجام نشد. دوباره امتحان کن." : undefined} />

      <div className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
        <div>
          <p className="font-bold">این‌ها دیده می‌شود</p>
          <ul className="mt-1 list-disc ps-5 text-muted-foreground">
            <li>اسم، نژاد و سن سگ</li>
            <li>دوره‌های تمام‌شده</li>
            <li>گواهی‌های معتبر</li>
            <li>جلسه‌هایی که مربی «قابل نمایش» علامت زده</li>
          </ul>
        </div>
        <div>
          <p className="font-bold">این‌ها هیچ‌وقت دیده نمی‌شود</p>
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
