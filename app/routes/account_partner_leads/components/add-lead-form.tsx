import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { cn } from "cn";
import { CheckIcon, PenLineIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { ChalkBubble } from "~/components/chalk-bubble";
import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { orpc } from "~/orpc/client";
import type { PartnerPerson } from "~/orpc/partner/contract";
import { m } from "~/paraglide/messages";
import { EdgeDog } from "~/routes/account_partner_leads/components/edge-dog";
import { PlateHead } from "~/routes/account_partner_leads/components/plate-head";
import { useFlash } from "~/routes/account_partner_leads/hooks/use-flash";
import { type WriteVoice, useWriteVoice } from "~/routes/account_partner_leads/hooks/use-write-voice";
import { PLATE } from "~/routes/account_partner_leads/plate";
import { type AddLeadFormValues, addLeadFormSchema } from "~/routes/account_partner_leads/schema";
import { applyAddLeadServerError } from "~/routes/account_partner_leads/server-errors";

/*===== Lines =====*/
/** The writing dog's two lines, read while rendering so they follow the page's language. */
function lineText(line: "listen" | "saved"): string {
  return line === "listen" ? m.account_partner_leads_form_line_listen() : m.account_partner_leads_form_line_saved();
}

/*===== Add Lead Form =====*/
/**
 * «یه شماره بنویس»: where a partner writes down the phone of someone about to sign up. The plate is calm (one field and
 * one button); the center's dog lies on its top edge writing in his notebook, the customer's door dimmed behind him. He
 * speaks only while the partner is in the form, and says «ثبت شد!» once when a number goes in.
 *
 * The server's refusals (not a number, already has an account, already entered) land under the field, anything else in
 * an alert. An inactive partner sees the `padlock` dog instead, both controls disabled and the reason, since the server
 * would refuse every number.
 */
export function AddLeadForm({
  isActive,
  onAdded,
}: {
  isActive: boolean;
  /** Called with the new person after the server accepted the number, before the list is reloaded. */
  onAdded: (person: PartnerPerson) => void;
}) {
  const addLead = useMutation(orpc.partner.leads.add.mutationOptions());
  const { voice, enter, leave, celebrate } = useWriteVoice();
  const justAdded = useFlash();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AddLeadFormValues>({
    resolver: zodResolver(addLeadFormSchema),
    defaultValues: { phoneNumber: "" },
  });

  /*------ Submit ------*/
  const onSubmit = handleSubmit((submitted) => {
    addLead.mutate(submitted, {
      onSuccess: (person) => {
        reset({ phoneNumber: "" });
        toast.add({ title: m.account_partner_leads_form_toast_added(), type: "success" });
        justAdded.flash();
        celebrate();
        onAdded(person);
        // Several numbers in a row is the usual visit: keep the cursor where the next one goes.
        // RHF's own `setFocus` found no element for this field, so the input is reached by its id.
        document.getElementById("lead-phone")?.focus();
      },
      onError: (error) => applyAddLeadServerError({ error, setError }),
    });
  });

  const blocked = !isActive;
  const hasFieldError = !!errors.phoneNumber;
  const describedBy = [hasFieldError && "lead-phone-error", blocked && "lead-phone-blocked"].filter(Boolean).join(" ");

  return (
    <section aria-labelledby="lead-form-title">
      {/*===== Heading and the Dog =====*/}
      <PlateHead
        id="lead-form-title"
        title={m.account_partner_leads_form_title()}
        figureClassName={blocked ? "ml-[3.5rem] sm:ml-[4.25rem]" : "ml-[2.5rem] sm:ml-[3rem]"}
        figure={
          blocked ? (
            <EdgeDog
              name="padlock"
              className="w-[5.25rem] sm:w-[6.25rem]"
              scenery={{ name: "door", className: "right-[72%] w-[95%] translate-y-[3%]" }}
            />
          ) : (
            <EdgeDog
              name="write"
              wide
              className="w-24 sm:w-[8.5rem]"
              scenery={{ name: "door", className: "right-[82%] w-[52%] translate-y-[3%]" }}
            >
              <WriteBubble voice={voice} />
            </EdgeDog>
          )
        }
      />

      {/*===== The Plate =====*/}
      <div className={PLATE}>
        <form method="post" onSubmit={onSubmit} noValidate>
          <div
            className="flex flex-col gap-4"
            onFocus={enter}
            onBlur={(event) => leave({ to: event.relatedTarget, within: event.currentTarget })}
          >
            {/*------ Field and Button ------*/}
            <Field data-invalid={hasFieldError}>
              <FieldLabel htmlFor="lead-phone">{m.account_partner_leads_form_label()}</FieldLabel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Input
                    id="lead-phone"
                    dir="ltr"
                    inputMode="tel"
                    autoComplete="off"
                    placeholder={m.account_partner_leads_form_placeholder()}
                    className="text-base tabular-nums"
                    disabled={blocked}
                    aria-invalid={hasFieldError}
                    aria-describedby={describedBy || undefined}
                    {...register("phoneNumber")}
                  />
                  <FieldError
                    key={errors.phoneNumber?.message}
                    id="lead-phone-error"
                    errors={[errors.phoneNumber]}
                    className="answer-in"
                  />
                </div>
                <SubmitButton isPending={addLead.isPending} isAdded={justAdded.on} disabled={blocked} />
              </div>
            </Field>

            {/*------ Why It Is Off ------*/}
            {blocked && (
              <p id="lead-phone-blocked" className="text-sm text-pretty text-muted-foreground">
                {m.account_partner_leads_form_inactive()}
              </p>
            )}

            {/*------ Form-Level Failure ------*/}
            {/* Rises in when it appears and again when the message changes. */}
            {errors.root?.message && (
              <div key={errors.root.message} className="answer-in">
                <FormAlert message={errors.root.message} />
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

/*===== Write Bubble =====*/
/**
 * The writing dog's chalk bubble, beside his head towards the heading (above its line). It pops from its tail on every new line (keyed by
 * the take) and fades out with his last words when he goes quiet; before he first speaks there is none. The tail is on
 * the bubble's bottom left (physical: he faces right), dipping towards his muzzle; in English the heading is on his left,
 * so the bubble opens leftwards with its tail on its bottom right, over his head (his muzzle is at the column's edge).
 *
 * Decoration only: the form says everything in plain words.
 */
function WriteBubble({ voice }: { voice: WriteVoice }) {
  if (!voice.last) return null;
  const speaking = voice.line !== null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-[78%] z-10 ltr:right-[calc(40%-2.25rem)] rtl:left-[86%]"
    >
      <ChalkBubble
        // A new key replays the pop; while quiet the key stays, so the fade-out runs once.
        key={speaking ? `say-${voice.take}` : "quiet"}
        tail="end"
        className={cn("max-w-none whitespace-nowrap", speaking ? "pl-say" : "pl-quiet")}
      >
        {lineText(voice.line ?? voice.last)}
      </ChalkBubble>
    </div>
  );
}

/*===== Submit Button =====*/
/**
 * The gold «ثبت شماره». Its icon cell holds three icons in one grid cell that turn into each other: the pen (idle), the
 * spinner (sending, with «در حال ثبت…») and a check (for two seconds after a number went in, with «ثبت شد»). It stays
 * enabled after a save, so the next number can go straight in; while sending it is disabled, so nothing is sent twice.
 */
function SubmitButton({ isPending, isAdded, disabled }: { isPending: boolean; isAdded: boolean; disabled: boolean }) {
  const turn = "transition duration-300 ease-out motion-reduce:transition-none";
  const shown = isPending ? "pending" : isAdded ? "added" : "idle";

  return (
    <Button
      type="submit"
      variant="solid"
      size="lg"
      className="h-14 w-full sm:w-auto sm:min-w-36"
      disabled={disabled || isPending}
    >
      <span aria-hidden className="grid place-items-center *:col-start-1 *:row-start-1">
        <PenLineIcon className={cn(turn, shown !== "idle" && "scale-50 rotate-90 opacity-0")} />
        <Spinner className={cn(turn, "size-5", shown !== "pending" && "scale-50 opacity-0")} />
        <CheckIcon strokeWidth={2.6} className={cn(turn, shown !== "added" && "scale-50 -rotate-90 opacity-0")} />
      </span>
      {isPending
        ? m.account_partner_leads_form_submitting()
        : isAdded
          ? m.account_partner_leads_form_submitted()
          : m.account_partner_leads_form_submit()}
    </Button>
  );
}
