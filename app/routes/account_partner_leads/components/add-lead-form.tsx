import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { orpc } from "~/orpc/client";
import type { PartnerPerson } from "~/orpc/partner/contract";
import { type AddLeadFormValues, addLeadFormSchema } from "~/routes/account_partner_leads/schema";
import { applyAddLeadServerError } from "~/routes/account_partner_leads/server-errors";

/*===== Constants =====*/
// The server's own sentence for an inactive account (`PARTNER_INACTIVE_MESSAGE`), shown up front so the partner does
// not type a number just to be refused.
const INACTIVE_MESSAGE = "همکاری‌ات فعلاً متوقف است؛ شماره‌ی تازه ثبت نمی‌شود.";

/*===== Add Lead Form =====*/
/**
 * Where a partner writes down the phone of someone about to sign up. One field and one button in a row; the server's
 * refusals (not a number, already has an account, already entered) land under the field, anything else in an alert.
 * An inactive partner sees both disabled and the reason, since the server would refuse every number.
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
        toast.add({ title: "شماره ثبت شد", type: "success" });
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

  return (
    <section aria-label="ثبت شماره" className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <form method="post" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {/*------ Field and Button ------*/}
        <Field data-invalid={hasFieldError}>
          <FieldLabel htmlFor="lead-phone">شماره‌ی موبایل مشتری</FieldLabel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Input
                id="lead-phone"
                dir="ltr"
                inputMode="tel"
                autoComplete="off"
                placeholder="۰۹۱۲…"
                disabled={blocked}
                aria-invalid={hasFieldError}
                aria-describedby={hasFieldError ? "lead-phone-error" : undefined}
                {...register("phoneNumber")}
              />
              <FieldError id="lead-phone-error" errors={[errors.phoneNumber]} />
            </div>
            <Button
              type="submit"
              variant="solid"
              size="lg"
              className="w-full sm:w-auto sm:min-w-40"
              disabled={blocked || addLead.isPending}
            >
              {addLead.isPending && <Spinner data-icon="inline-start" />}
              {addLead.isPending ? "در حال ثبت…" : "ثبت شماره"}
            </Button>
          </div>
        </Field>

        {/*------ Why It Is Off ------*/}
        {blocked && <p className="text-sm text-pretty text-muted-foreground">{INACTIVE_MESSAGE}</p>}

        {/*------ Form-Level Failure ------*/}
        <FormAlert message={errors.root?.message} />
      </form>
    </section>
  );
}
