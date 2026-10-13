import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { useSaveSheba } from "~/routes/account_profile/hooks/use-save-sheba";
import {
  extractShebaDigits,
  formatShebaForField,
  type ShebaFormInput,
  type ShebaFormValues,
  shebaFormSchema,
} from "~/routes/account_profile/schema";
import { applyShebaServerError } from "~/routes/account_profile/server-errors";

/*===== Sheba Form =====*/
/**
 * The partner's Sheba card, saved on its own (it is a different API from the name). The Admin pays the commission to
 * this number, so a partner who hasn't written one yet is told plainly what that costs them.
 *
 * Typed in any digits and with or without spaces; saved as `IR` + 24 digits and shown back in groups of four. The save
 * button stays disabled until the number differs from the saved one, spaces and digit style aside.
 */
export function ShebaForm({
  savedSheba,
  onFocusCard,
  onSaved,
}: {
  /** `IR` + 24 digits, or null until the partner has written it. */
  savedSheba: string | null;
  onFocusCard: () => void;
  onSaved: () => void;
}) {
  const [saved, setSaved] = useState(savedSheba);
  const saveSheba = useSaveSheba();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ShebaFormInput, unknown, ShebaFormValues>({
    resolver: zodResolver(shebaFormSchema),
    defaultValues: { shebaNumber: formatShebaForField(saved) },
  });

  /*------ Dirty ------*/
  // Compared as digits: re-spacing the saved number, or retyping it in Persian digits, is not a change.
  const typed = useWatch({ control, name: "shebaNumber" });
  const savedDigits = saved ? extractShebaDigits(saved) : null;
  const isDirty = (extractShebaDigits(typed ?? "") ?? (typed ?? "").trim()) !== (savedDigits ?? "");

  /*------ Submit ------*/
  const onSubmit = handleSubmit((submitted) => {
    saveSheba.mutate(submitted, {
      onSuccess: (profile) => {
        setSaved(profile.shebaNumber);
        reset({ shebaNumber: formatShebaForField(profile.shebaNumber) });
        toast.add({ title: "ذخیره شد.", type: "success" });
        onSaved();
      },
      onError: (error) => applyShebaServerError({ error, setError }),
    });
  });

  return (
    <section
      aria-labelledby="profile-sheba-title"
      className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8"
    >
      <h2 id="profile-sheba-title" className="text-lg font-extrabold">
        واریز کمیسیون
      </h2>
      {!saved && (
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          هنوز شبا ننوشتی؛ تا ننویسی نمی‌تونیم کمیسیونت رو واریز کنیم.
        </p>
      )}

      <form method="post" onSubmit={onSubmit} noValidate className="mt-6">
        <div className="flex flex-col gap-6" onFocus={onFocusCard}>
          <Field data-invalid={!!errors.shebaNumber}>
            <FieldLabel htmlFor="profile-sheba">شماره‌ی شبا</FieldLabel>
            {/* Latin digits and letters read left to right, so the group is LTR with «IR» at its left edge. */}
            <InputGroup dir="ltr">
              <InputGroupAddon className="font-bold text-foreground">IR</InputGroupAddon>
              <InputGroupInput
                id="profile-sheba"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0000 0000 0000 0000 0000 0000"
                className="tabular-nums"
                aria-invalid={!!errors.shebaNumber}
                {...register("shebaNumber")}
              />
            </InputGroup>
            <FieldDescription>کمیسیون‌هات به این شبا واریز می‌شه.</FieldDescription>
            <FieldError errors={[errors.shebaNumber]} />
          </Field>

          {/* Directly above the button, where the eye is after pressing it. */}
          <FormAlert message={errors.root?.message} />

          <Button
            type="submit"
            className="w-full sm:w-auto sm:min-w-36 sm:self-start"
            disabled={!isDirty || saveSheba.isPending}
          >
            {saveSheba.isPending && <Spinner data-icon="inline-start" />}
            {saveSheba.isPending ? "در حال ذخیره…" : "ذخیره"}
          </Button>
        </div>
      </form>
    </section>
  );
}
