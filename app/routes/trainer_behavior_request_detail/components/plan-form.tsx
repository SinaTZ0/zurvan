import { useMutation } from "@tanstack/react-query";
import { ORPCError } from "@orpc/client";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { PlanSlip } from "~/components/plan-slip";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "~/components/ui/toast";
import { formatPlanDeadline } from "~/lib/behavior-format";
import { describeApiFailure } from "~/lib/api-error";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { client } from "~/orpc/client";
import { BEHAVIOR_PLAN_MAX_SESSIONS, BEHAVIOR_TRAINER_NOTE_MAX_LENGTH } from "~/orpc/behavior-request/constants";
import type { BehaviorPlan } from "~/orpc/behavior-request/contract";
import { parseTomanToRial, planExpiryFrom, rialToTomanInput } from "~/routes/trainer_behavior_request_detail/format";

/*===== Plan Form =====*/
/**
 * The plan the owner reads, written as the slip he'll get: sessions, price in toman, the note, and under them the live
 * slip with the date it expires. «برنامه را بفرست» is the page's one gold-leaf action.
 *
 * Replacing a plan (`plan` given) restarts the 7 days and cancels an order the owner already opened from the old one, so
 * the form says so before the button.
 *
 * @param plan The proposed plan being replaced, prefilled; `null` for a first proposal.
 * @param now The page's render time, so the preview's deadline matches what the server will set.
 */
export function PlanForm({
  requestId,
  now,
  plan,
  onSent,
  onCancel,
}: {
  requestId: string;
  now: Date;
  plan: BehaviorPlan | null;
  onSent: () => void;
  onCancel?: () => void;
}) {
  const revalidator = useRevalidator();
  const [sessions, setSessions] = useState(plan?.sessions ?? 1);
  const [priceText, setPriceText] = useState(plan ? rialToTomanInput(plan.price) : "");
  const [note, setNote] = useState(plan?.note ?? "");
  const [alert, setAlert] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const propose = useMutation({
    mutationFn: (input: { sessions: number; price: number; note: string }) =>
      client.behaviorRequest.trainer.propose({ id: requestId, ...input }),
    onSuccess: async () => {
      toast.add({ title: "برنامه فرستاده شد", type: "success" });
      onSent();
      await revalidator.revalidate();
    },
    onError: async (error) => {
      const failure = describeApiFailure({ error, fallback: "برنامه فرستاده نشد. دوباره امتحان کن." });
      setAlert(failure.message);
      setFields(failure.fields);
      // The request changed under us (paid, declined, withdrawn or expired meanwhile): show what it is now.
      if (error instanceof ORPCError && (error.code === "NOT_ANSWERABLE" || error.code === "NOT_FOUND")) {
        // The card remounts with the new status, which clears this alert, so the reason also goes to a toast.
        toast.add({ title: failure.message ?? "این درخواست دیگر در انتظار پاسخ نیست.", type: "error" });
        await revalidator.revalidate();
      }
    },
  });

  function submit(event: React.SyntheticEvent) {
    event.preventDefault();
    setAlert(null);
    const price = parseTomanToRial(priceText);
    if (price === null) {
      setFields({ price: "مبلغ را درست بنویس." });
      return;
    }
    setFields({});
    propose.mutate({ sessions, price, note });
  }

  const deadline = formatPlanDeadline(planExpiryFrom(now));

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-8">
      <FormAlert message={alert ?? undefined} />

      {plan && (
        <p className="border-s-2 border-primary/50 ps-3 text-sm text-pretty">
          ویرایش برنامه، هفت روز فرصت پرداخت را از اول می‌شمارد. اگر صاحب سگ الان سفارش این برنامه را باز کرده باشد، آن
          سفارش لغو می‌شود.
        </p>
      )}

      {/*------ Sessions ------*/}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm leading-none font-medium">تعداد جلسه‌ها</legend>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="یک جلسه کمتر"
            disabled={sessions <= 1}
            onClick={() => setSessions((current) => Math.max(1, current - 1))}
          >
            <MinusIcon aria-hidden />
          </Button>
          <output aria-live="polite" className="min-w-12 text-center text-2xl font-extrabold tabular-nums">
            {formatNumberFa(sessions)}
          </output>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="یک جلسه بیشتر"
            disabled={sessions >= BEHAVIOR_PLAN_MAX_SESSIONS}
            onClick={() => setSessions((current) => Math.min(BEHAVIOR_PLAN_MAX_SESSIONS, current + 1))}
          >
            <PlusIcon aria-hidden />
          </Button>
        </div>
        <FieldError>{fields.sessions}</FieldError>
      </fieldset>

      {/*------ Price ------*/}
      <Field data-invalid={!!fields.price}>
        <FieldLabel htmlFor="plan-price">مبلغ کل به تومان</FieldLabel>
        <FieldDescription>با رقم فارسی یا انگلیسی بنویس؛ مثلاً ۱۲۰٬۰۰۰٬۰۰۰</FieldDescription>
        <Input
          id="plan-price"
          inputMode="numeric"
          autoComplete="off"
          value={priceText}
          aria-invalid={!!fields.price}
          onChange={(event) => setPriceText(toPersianDigits(event.target.value))}
          className="h-12 text-lg font-bold tabular-nums"
        />
        <FieldError>{fields.price}</FieldError>
      </Field>

      {/*------ Note ------*/}
      <Field data-invalid={!!fields.note}>
        <FieldLabel htmlFor="plan-note">توضیح برنامه</FieldLabel>
        <FieldDescription>صاحب سگ این را می‌خواند و زیر نامت می‌بیند.</FieldDescription>
        <Textarea
          id="plan-note"
          value={note}
          maxLength={BEHAVIOR_TRAINER_NOTE_MAX_LENGTH}
          aria-invalid={!!fields.note}
          onChange={(event) => setNote(event.target.value)}
          className="min-h-28"
          placeholder="مثلاً: اول با ارزیابی حضوری شروع می‌کنیم، بعد هفته‌ای دو جلسه"
        />
        <FieldError>{fields.note}</FieldError>
      </Field>

      {/*------ Live Slip ------*/}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-muted-foreground">این چیزی است که صاحب سگ می‌بیند</p>
        <PlanSlip
          plan={{ sessions, price: parseTomanToRial(priceText), note }}
          daysLeft={null}
          deadline={deadline}
          signer={HEAD_TRAINER.firstName}
        />
      </div>

      {/*------ Actions ------*/}
      <div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-between">
        <Button type="submit" disabled={propose.isPending} className="w-full sm:w-auto sm:min-w-48">
          {propose.isPending && <Spinner data-icon="inline-start" />}
          برنامه را بفرست
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            انصراف
          </Button>
        )}
      </div>
    </form>
  );
}
