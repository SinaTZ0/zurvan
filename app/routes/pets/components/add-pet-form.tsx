import { zodResolver } from "@hookform/resolvers/zod";
import { isDefinedError } from "@orpc/client";
import { Controller, type DefaultValues, useForm, type UseFormSetError } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "~/components/ui/input-group";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { useCreatePet } from "~/routes/pets/hooks/use-create-pet";
import { type AddPetFormInput, type AddPetFormOutput, addPetFormSchema } from "~/routes/pets/schema";
import { SpeciesPicker } from "~/routes/pets/components/species-picker";

// No species by default: the user picks one, and the picker shows nothing selected until then.
const DEFAULT_VALUES: DefaultValues<AddPetFormInput> = { name: "", breed: "", ageYears: "" };

const FORM_FIELDS = ["species", "name", "breed", "ageYears"] as const;

type CreatePetError = NonNullable<ReturnType<typeof useCreatePet>["error"]>;

/*===== Add Pet Form =====*/
/** Adds a pet for the signed-in user. Keeps the input after a failure and clears it after success. */
export function AddPetForm({ className }: { className?: string }) {
  const createPet = useCreatePet();
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AddPetFormInput, unknown, AddPetFormOutput>({
    resolver: zodResolver(addPetFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit(({ breed, ...values }) => {
    createPet.mutate(
      { ...values, breed: breed || undefined },
      {
        onSuccess: (pet) => {
          reset();
          toast.add({ title: `${pet.name} ثبت شد.`, type: "success" });
        },
        onError: (error) => applyServerError({ error, setError }),
      },
    );
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          <h2 className="text-lg">حیوانت را اضافه کن</h2>
        </CardTitle>
        <CardDescription>نام و گونه کافی است، نژاد و سن اختیاری‌اند.</CardDescription>
      </CardHeader>

      <CardContent>
        <form method="post" onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormAlert message={errors.root?.message} />

            {/*------ Species ------*/}
            <Field data-invalid={!!errors.species}>
              <Controller
                control={control}
                name="species"
                render={({ field, fieldState }) => (
                  <SpeciesPicker
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={fieldState.invalid}
                    errorId="pet-species-error"
                  />
                )}
              />
              <FieldError id="pet-species-error" errors={[errors.species]} />
            </Field>

            {/*------ Name ------*/}
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="pet-name">نام حیوان</FieldLabel>
              <Input
                id="pet-name"
                autoComplete="off"
                placeholder="مثلاً لئو"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            {/*------ Breed and Age ------*/}
            <div className="grid grid-cols-[1fr_8rem] gap-3">
              <Field data-invalid={!!errors.breed}>
                <FieldLabel htmlFor="pet-breed">نژاد (اختیاری)</FieldLabel>
                <Input
                  id="pet-breed"
                  autoComplete="off"
                  placeholder="مثلاً گلدن رتریور"
                  aria-invalid={!!errors.breed}
                  {...register("breed")}
                />
                <FieldError errors={[errors.breed]} />
              </Field>

              <Field data-invalid={!!errors.ageYears}>
                <FieldLabel htmlFor="pet-age">سن (اختیاری)</FieldLabel>
                <InputGroup>
                  {/* Text, not type="number": number inputs reject Persian digits in some browsers. */}
                  <InputGroupInput
                    id="pet-age"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="۳"
                    aria-invalid={!!errors.ageYears}
                    {...register("ageYears")}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>سال</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError errors={[errors.ageYears]} />
              </Field>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={createPet.isPending}>
              {createPet.isPending && <Spinner data-icon="inline-start" />}
              ثبت حیوان
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

/*===== Server Errors =====*/
/**
 * Puts a failed request's messages where the user will see them: field messages next to their
 * inputs, everything else in the form-level alert.
 */
function applyServerError({ error, setError }: { error: CreatePetError; setError: UseFormSetError<AddPetFormInput> }) {
  if (isDefinedError(error)) {
    if (error.code === "INVALID_INPUT") {
      for (const field of FORM_FIELDS) {
        const message = error.data.fields[field];
        if (message) setError(field, { message });
      }
      const [general] = error.data.errors;
      if (general) setError("root", { message: general });
      return;
    }

    if (error.code === "UNAUTHORIZED") {
      setError("root", { message: "نشست شما تمام شده است. صفحه را تازه کنید و دوباره وارد شوید." });
      return;
    }

    if (error.code === "INTERNAL_SERVER_ERROR") {
      setError("root", {
        message: `ثبت حیوان انجام نشد. دوباره امتحان کنید. کد پیگیری: ${error.data.errorId}`,
      });
      return;
    }
  }

  setError("root", { message: "ثبت حیوان انجام نشد. اتصال اینترنت را بررسی کنید و دوباره امتحان کنید." });
}
