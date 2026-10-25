import { useFormContext, useWatch, type UseFormRegisterReturn } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { DOG_BREED_PURITIES, DOG_BREED_PURITY_LABELS } from "~/orpc/dog/constants";
import { m } from "~/paraglide/messages";
import { breedSuggestions } from "~/routes/account_dog_form/breeds";
import { ChoicePills } from "~/routes/account_dog_form/components/choice-pills";
import type { DogFormInput, DogFormValues } from "~/routes/account_dog_form/schema";

const SUGGESTIONS_ID = "dog-breed-suggestions";

/*===== Breed Fields =====*/
/**
 * The breed type, then the breed inputs it asks for (F2, the server's rules in `app/orpc/dog/validation.ts`):
 * - purebred: one breed;
 * - cross: the breeds of its two parents, with «×» between them, as the site prints them («پامرانین × شیتزو»);
 * - mixed: what it looks like, optional.
 *
 * Nothing until a type is picked. The first input is the same `breed` field whatever the type, so the text typed
 * survives a change of mind (a purebred's breed becomes a cross's first parent). The inputs rise in again when the
 * type changes (keyed by it). Every input offers the same suggestions.
 */
export function BreedFields() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<DogFormInput, unknown, DogFormValues>();
  const purity = useWatch({ control, name: "breedPurity" });
  const breeds = breedSuggestions();

  return (
    <div className="flex flex-col gap-4">
      <ChoicePills
        legend={m.account_dog_form_field_purity()}
        description={m.account_dog_form_purity_hint()}
        options={DOG_BREED_PURITIES.map((value) => ({ value, label: DOG_BREED_PURITY_LABELS[value] }))}
        registration={register("breedPurity")}
        error={errors.breedPurity}
      />

      {/*------ Breed Inputs ------*/}
      {purity === "cross" ? (
        <div key="cross" className="answer-in grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2 sm:gap-x-3">
          <BreedInput
            id="dog-breed"
            label={m.account_dog_form_field_breed_parent_one()}
            placeholder={m.account_dog_form_breed_parent_one_placeholder()}
            registration={register("breed")}
            error={errors.breed}
          />
          {/* Level with the inputs (under the labels); the parents' breeds read as the site prints a cross. */}
          <span aria-hidden className="mt-7 flex h-14 items-center font-display text-2xl text-primary">
            ×
          </span>
          <BreedInput
            id="dog-breed-secondary"
            label={m.account_dog_form_field_breed_parent_two()}
            placeholder={m.account_dog_form_breed_parent_two_placeholder()}
            registration={register("breedSecondary")}
            error={errors.breedSecondary}
          />
        </div>
      ) : purity === "purebred" || purity === "mixed" ? (
        <div key={purity} className="answer-in">
          <BreedInput
            id="dog-breed"
            label={purity === "mixed" ? m.account_dog_form_field_breed_looks_like() : m.account_dog_form_field_breed()}
            optional={purity === "mixed"}
            placeholder={
              purity === "mixed"
                ? m.account_dog_form_breed_looks_like_placeholder()
                : m.account_dog_form_breed_placeholder()
            }
            registration={register("breed")}
            error={errors.breed}
          />
        </div>
      ) : null}

      <datalist id={SUGGESTIONS_ID}>
        {breeds.map((breed) => (
          <option key={breed} value={breed}>
            {breed}
          </option>
        ))}
      </datalist>
    </div>
  );
}

/*===== Breed Input =====*/
function BreedInput({
  id,
  label,
  optional = false,
  placeholder,
  registration,
  error,
}: {
  id: string;
  label: string;
  optional?: boolean;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: { message?: string };
}) {
  return (
    <Field data-invalid={!!error} className="min-w-0">
      <FieldLabel htmlFor={id} className="min-h-5">
        {label}
        {optional && <span className="font-medium text-muted-foreground"> {m.account_dog_form_optional()}</span>}
      </FieldLabel>
      <Input
        id={id}
        list={SUGGESTIONS_ID}
        autoComplete="off"
        placeholder={placeholder}
        aria-invalid={!!error}
        {...registration}
      />
      {/* Keyed by the message, so a new one rises in again. */}
      <FieldError key={error?.message} errors={[error]} className="answer-in" />
    </Field>
  );
}
