import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import type { ApiFailure } from "~/lib/api-error";
import {
  CREATE_FIELD_NAMES,
  type CreatePartnerInput,
  type CreatePartnerValues,
  createPartnerSchema,
} from "~/routes/admin_partners/schema";

/*===== Create Form =====*/
/**
 * The new partner's account as a form, inside the create sheet: a scrolling body and a footer with «ساخت حساب» /
 * «انصراف». The sheet owns the request; this validates, hands the sheet the values, and puts the sheet's `failure` on
 * the fields (`data.fields`: a taken phone or code) and in the alert above the buttons. Input is kept after a failure.
 */
export function CreateForm({
  siteOrigin,
  isPending,
  failure,
  onSubmit,
  onCancel,
}: {
  siteOrigin: string;
  isPending: boolean;
  failure: ApiFailure | null;
  onSubmit: (values: CreatePartnerValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreatePartnerInput, unknown, CreatePartnerValues>({
    resolver: zodResolver(createPartnerSchema),
    defaultValues: { firstName: "", lastName: "", phoneNumber: "", code: "" },
  });

  /*------ Server Messages ------*/
  const orphanMessages: string[] = [];
  useEffect(() => {
    if (!failure) return;
    for (const [field, message] of Object.entries(failure.fields)) {
      const target = CREATE_FIELD_NAMES.find((name) => name === field);
      if (target) setError(target, { message });
    }
  }, [failure, setError]);
  // A field the form doesn't have (it shouldn't happen) is added to the alert instead of being lost.
  for (const [field, message] of Object.entries(failure?.fields ?? {})) {
    if (!CREATE_FIELD_NAMES.some((name) => name === field)) orphanMessages.push(message);
  }
  const alert = [failure?.message, ...orphanMessages].filter(Boolean).join(" ");

  /*------ Link Preview ------*/
  const code = useWatch({ control, name: "code" }).trim();

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
      {/*===== Fields (scrolling) =====*/}
      <div data-lenis-prevent className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={!!errors.firstName}>
            <FieldLabel htmlFor="new-partner-first-name">نام</FieldLabel>
            <Input
              id="new-partner-first-name"
              autoComplete="off"
              aria-invalid={!!errors.firstName}
              {...register("firstName")}
            />
            <FieldError errors={[errors.firstName]} />
          </Field>

          <Field data-invalid={!!errors.lastName}>
            <FieldLabel htmlFor="new-partner-last-name">نام خانوادگی</FieldLabel>
            <Input
              id="new-partner-last-name"
              autoComplete="off"
              aria-invalid={!!errors.lastName}
              {...register("lastName")}
            />
            <FieldError errors={[errors.lastName]} />
          </Field>
        </div>

        <Field data-invalid={!!errors.phoneNumber}>
          <FieldLabel htmlFor="new-partner-phone">شماره‌ی موبایل</FieldLabel>
          <Input
            id="new-partner-phone"
            dir="ltr"
            inputMode="tel"
            autoComplete="off"
            className="text-end tabular-nums"
            placeholder="09123456789"
            aria-invalid={!!errors.phoneNumber}
            {...register("phoneNumber")}
          />
          <FieldDescription>با همین شماره و کد پیامکی وارد می‌شود.</FieldDescription>
          <FieldError errors={[errors.phoneNumber]} />
        </Field>

        <Field data-invalid={!!errors.code}>
          <FieldLabel htmlFor="new-partner-code">کد لینک (اختیاری)</FieldLabel>
          <Input
            id="new-partner-code"
            dir="ltr"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={!!errors.code}
            {...register("code")}
          />
          <FieldDescription>
            <bdi dir="ltr" className="break-all">
              {siteOrigin}/?ref={code || "…"}
            </bdi>
            <br />
            بعد از ساختن عوض نمی‌شود، چون روی کارت و QR فروشگاهش چاپ می‌شود.
          </FieldDescription>
          <FieldError errors={[errors.code]} />
        </Field>
      </div>

      {/*===== Footer (fixed) =====*/}
      <footer className="flex flex-col gap-3 border-t border-border p-4">
        {/* Directly above the buttons, where the eye is after pressing one. */}
        <FormAlert message={alert || undefined} />

        <div className="flex gap-2">
          <Button type="submit" variant="solid" className="flex-1" disabled={isPending}>
            {isPending && <Spinner aria-hidden />}
            {isPending ? "در حال ساخت…" : "ساخت حساب"}
          </Button>
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            انصراف
          </Button>
        </div>
      </footer>
    </form>
  );
}
