import { useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { m } from "~/paraglide/messages";
import { ChoicePills } from "~/routes/account_dog_form/components/choice-pills";
import type { DogFormInput, DogFormValues } from "~/routes/account_dog_form/schema";

/*===== Body Fields =====*/
/**
 * The dog's body: the weight and whether it is neutered (both asked, for the sessions' safety), then the height at the
 * shoulder, the coat color and any markings, which help pick the dog out and are optional. The weight and the height
 * are short numbers, so they share a row from `sm`.
 */
export function BodyFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<DogFormInput, unknown, DogFormValues>();

  return (
    <>
      <div className="grid gap-x-4 gap-y-7 sm:grid-cols-2">
        <Field data-invalid={!!errors.weight}>
          <FieldLabel htmlFor="dog-weight">{m.account_dog_form_field_weight()}</FieldLabel>
          <Input
            id="dog-weight"
            inputMode="decimal"
            autoComplete="off"
            placeholder={m.account_dog_form_weight_placeholder()}
            aria-invalid={!!errors.weight}
            {...register("weight")}
          />
          <FieldError key={errors.weight?.message} errors={[errors.weight]} className="answer-in" />
        </Field>

        <Field data-invalid={!!errors.height}>
          <FieldLabel htmlFor="dog-height">
            {m.account_dog_form_field_height()}{" "}
            <span className="font-medium text-muted-foreground">{m.account_dog_form_optional()}</span>
          </FieldLabel>
          <Input
            id="dog-height"
            inputMode="numeric"
            autoComplete="off"
            placeholder={m.account_dog_form_height_placeholder()}
            aria-invalid={!!errors.height}
            {...register("height")}
          />
          <FieldDescription>{m.account_dog_form_height_hint()}</FieldDescription>
          <FieldError key={errors.height?.message} errors={[errors.height]} className="answer-in" />
        </Field>
      </div>

      <ChoicePills
        legend={m.account_dog_form_field_neutered()}
        options={[
          { value: "yes", label: m.account_dog_form_yes() },
          { value: "no", label: m.account_dog_form_no() },
        ]}
        registration={register("isNeutered")}
        error={errors.isNeutered}
      />

      <Field data-invalid={!!errors.coatColor}>
        <FieldLabel htmlFor="dog-coat">
          {m.account_dog_form_field_coat()}{" "}
          <span className="font-medium text-muted-foreground">{m.account_dog_form_optional()}</span>
        </FieldLabel>
        <Input
          id="dog-coat"
          autoComplete="off"
          placeholder={m.account_dog_form_coat_placeholder()}
          aria-invalid={!!errors.coatColor}
          {...register("coatColor")}
        />
        <FieldError key={errors.coatColor?.message} errors={[errors.coatColor]} className="answer-in" />
      </Field>

      <Field data-invalid={!!errors.markings}>
        <FieldLabel htmlFor="dog-markings">
          {m.account_dog_form_field_markings()}{" "}
          <span className="font-medium text-muted-foreground">{m.account_dog_form_optional()}</span>
        </FieldLabel>
        <Textarea
          id="dog-markings"
          rows={2}
          className="min-h-20"
          placeholder={m.account_dog_form_markings_placeholder()}
          aria-invalid={!!errors.markings}
          {...register("markings")}
        />
        <FieldError key={errors.markings?.message} errors={[errors.markings]} className="answer-in" />
      </Field>
    </>
  );
}
