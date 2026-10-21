import { zodResolver } from "@hookform/resolvers/zod";
import { LandmarkIcon, PiggyBankIcon } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";
import { toast } from "~/components/ui/toast";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { CardVoiceProps } from "~/routes/account_profile/card-voice-props";
import { CardBubble } from "~/routes/account_profile/components/card-bubble";
import { CardHead } from "~/routes/account_profile/components/card-head";
import { EdgeDog } from "~/routes/account_profile/components/edge-dog";
import { RisingAlert } from "~/routes/account_profile/components/rising-alert";
import { SaveButton } from "~/routes/account_profile/components/save-button";
import { useFlash } from "~/routes/account_profile/hooks/use-flash";
import { useSaveSheba } from "~/routes/account_profile/hooks/use-save-sheba";
import { PLATE } from "~/routes/account_profile/plate";
import {
  extractShebaDigits,
  formatShebaForField,
  type ShebaFormInput,
  type ShebaFormValues,
  shebaFormSchema,
} from "~/routes/account_profile/schema";
import { applyShebaServerError } from "~/routes/account_profile/server-errors";

/*===== Sheba Card =====*/
/**
 * «واریز کمیسیون», a partner's only: the Sheba the head trainer pays the commission to, saved on its own (it is a
 * different API from the name). A partner who hasn't written one yet gets a gold-bordered notice saying what that costs
 * them; it folds away once a Sheba is saved.
 *
 * Typed in any digits and with or without spaces; saved as `IR` + 24 digits and shown back in groups of four. The save
 * button stays disabled until the number differs from the saved one, spaces and digit style aside.
 *
 * The `piggy` dog lies on the plate's top edge with a paw on his piggy bank, the dimmed safe behind him.
 */
export function ShebaCard({
  savedSheba,
  voice,
  onEnter,
  onSaved,
  onFailed,
}: {
  /** `IR` + 24 digits, or null until the partner has written it. */
  savedSheba: string | null;
  voice: CardVoiceProps;
  onEnter: () => void;
  onSaved: () => void;
  onFailed: () => void;
}) {
  const [saved, setSaved] = useState(savedSheba);
  const justSaved = useFlash();
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
        justSaved.flash();
        onSaved();
      },
      onError: (error) => {
        applyShebaServerError({ error, setError });
        onFailed();
      },
    });
  }, onFailed);

  return (
    <section aria-labelledby="profile-sheba-title">
      <CardHead
        id="profile-sheba-title"
        title="واریز کمیسیون"
        figureClassName="me-[3.5rem] sm:me-[5.5rem]"
        figure={
          <EdgeDog
            name="piggy"
            wide
            className="w-[6.25rem] sm:w-[9rem]"
            scenery={{ name: "safe", className: "right-[80%] w-[66%] translate-y-[3%]" }}
          >
            <CardBubble {...voice} className="bottom-[80%] left-[94%] sm:bottom-[62%]" />
          </EdgeDog>
        }
      />

      <div className={PLATE}>
        <p className="text-pretty text-muted-foreground">
          {HEAD_TRAINER.firstName} کمیسیون‌هات رو به همین شبا واریز می‌کنه.
        </p>

        {/*------ No Sheba Yet ------*/}
        {/* Kept mounted so it folds away as one motion once a Sheba is saved; it rises in on load. */}
        <div className="pf-fold" data-open={!saved}>
          <div className="min-h-0 overflow-hidden">
            <p className="answer-in mt-5 flex items-start gap-3 rounded-2xl border border-primary/60 bg-primary/[0.06] px-4 py-3 text-pretty [--answer-delay:0.5s]">
              <PiggyBankIcon aria-hidden strokeWidth={1.8} className="mt-0.5 size-5 shrink-0 text-primary" />
              هنوز شبایی ننوشتی؛ برای گرفتن پورسانت، شماره‌ی شبا لازمه.
            </p>
          </div>
        </div>

        <form method="post" onSubmit={onSubmit} noValidate className="mt-6">
          <div className="flex flex-col gap-6" onFocus={onEnter}>
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
              <FieldDescription>۲۴ رقمِ بعد از IR؛ با فاصله یا بی‌فاصله، رقم فارسی هم قبوله.</FieldDescription>
              <FieldError key={errors.shebaNumber?.message} errors={[errors.shebaNumber]} className="answer-in" />
            </Field>

            <RisingAlert message={errors.root?.message} />

            <SaveButton
              label="ذخیره"
              icon={<LandmarkIcon />}
              isPending={saveSheba.isPending}
              isSaved={justSaved.on}
              disabled={!isDirty}
            />
          </div>
        </form>
      </div>
    </section>
  );
}
