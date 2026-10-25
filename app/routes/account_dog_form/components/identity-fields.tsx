import { useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { DOG_SEX_LABELS, DOG_SEXES } from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";
import { m } from "~/paraglide/messages";
import { BirthDateField } from "~/routes/account_dog_form/components/birth-date-field";
import { BreedFields } from "~/routes/account_dog_form/components/breed-fields";
import { ChoicePills } from "~/routes/account_dog_form/components/choice-pills";
import { LockedFields } from "~/routes/account_dog_form/components/locked-fields";
import type { DogFormInput, DogFormValues } from "~/routes/account_dog_form/schema";

/*===== Identity Fields =====*/
/**
 * Who the dog is: the name, the sex, the birth date (or an age) and the breed type with its breed inputs, all asked.
 * Once the dog is evaluated (`lockedDog`), the breed type, the breed(s) and the birth date are shown as locked plates
 * instead; the server's error for a locked birth date (`birthDate` maps to `birthDay`) shows under its plate.
 */
export function IdentityFields({ lockedDog }: { lockedDog: Dog | null }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<DogFormInput, unknown, DogFormValues>();

  return (
    <>
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="dog-name">{m.account_dog_form_field_name()}</FieldLabel>
        <Input id="dog-name" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
        <FieldError key={errors.name?.message} errors={[errors.name]} className="answer-in" />
      </Field>

      <ChoicePills
        legend={m.account_dog_form_field_sex()}
        options={DOG_SEXES.map((sex) => ({ value: sex, label: DOG_SEX_LABELS[sex] }))}
        registration={register("sex")}
        error={errors.sex}
      />

      {lockedDog ? (
        <LockedFields
          dog={lockedDog}
          purityError={errors.breedPurity}
          breedError={errors.breed ?? errors.breedSecondary}
          birthError={errors.birthDay ?? errors.ageYears}
        />
      ) : (
        <>
          <BirthDateField />
          <BreedFields />
        </>
      )}
    </>
  );
}
