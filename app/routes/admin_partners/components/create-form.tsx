import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { ADMIN_TEAR } from "~/lib/admin-plate";
import type { ApiFailure } from "~/lib/api-error";
import {
  CREATE_FIELD_NAMES,
  type CreatePartnerInput,
  type CreatePartnerValues,
  createPartnerSchema,
} from "~/routes/admin_partners/schema";

/*===== Constants =====*/
/** A group of fields: the slip's tear above every one but the first. */
const GROUP = cn("grid gap-6 border-t py-6 first:border-t-0 first:pt-0 last:pb-0", ADMIN_TEAR);

/*===== Create Form =====*/
/**
 * The new partner's account as a form, inside the create sheet: a scrolling body (who he is, how he signs in, his
 * link) and a footer that stays put, with «انصراف» and «ساختن حساب» last (the sheet's one gold button). The sheet owns
 * the request; this validates, hands the sheet the values, and puts the sheet's `failure` on the fields (`data.fields`:
 * a taken phone or code) and in the alert above the buttons. Input is kept after a failure.
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
      <div data-lenis-prevent className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
        {/*------ Who ------*/}
        <div className={cn(GROUP, "sm:grid-cols-2")}>
          <Field data-invalid={!!errors.firstName}>
            <FieldLabel htmlFor="new-partner-first-name">نام</FieldLabel>
            <Input
              id="new-partner-first-name"
              autoComplete="off"
              readOnly={isPending}
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
              readOnly={isPending}
              aria-invalid={!!errors.lastName}
              {...register("lastName")}
            />
            <FieldError errors={[errors.lastName]} />
          </Field>
        </div>

        {/*------ Sign-In ------*/}
        <div className={GROUP}>
          <Field data-invalid={!!errors.phoneNumber}>
            <FieldLabel htmlFor="new-partner-phone">شماره‌ی موبایل</FieldLabel>
            <Input
              id="new-partner-phone"
              dir="ltr"
              inputMode="tel"
              autoComplete="off"
              readOnly={isPending}
              className="text-end tabular-nums"
              placeholder="09123456789"
              aria-invalid={!!errors.phoneNumber}
              {...register("phoneNumber")}
            />
            <FieldDescription>با همین شماره و کد پیامکی وارد می‌شه.</FieldDescription>
            <FieldError errors={[errors.phoneNumber]} />
          </Field>
        </div>

        {/*------ Link ------*/}
        <div className={GROUP}>
          <Field data-invalid={!!errors.code}>
            <FieldLabel htmlFor="new-partner-code">کد لینک (اختیاری)</FieldLabel>
            <Input
              id="new-partner-code"
              dir="ltr"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              readOnly={isPending}
              aria-invalid={!!errors.code}
              {...register("code")}
            />
            {/* The link as it will be printed, live: the code is the one thing here that can't be fixed later. */}
            <p className="rounded-xl bg-background/70 px-3.5 py-2.5 text-sm break-all shadow-[inset_0_1px_3px_rgb(0_0_0/0.6)] ring-1 ring-foreground/10">
              <span className="sr-only">لینکش: </span>
              <bdi dir="ltr">
                {siteOrigin}/?ref=
                <span className={code ? "font-bold text-foreground" : "text-muted-foreground"}>{code || "…"}</span>
              </bdi>
            </p>
            <FieldDescription>
              خالی بذاری، یه کد براش ساخته می‌شه. بعد از ساختن دیگه عوض نمی‌شه، چون روی کارت و QR فروشگاهش چاپ می‌شه.
            </FieldDescription>
            <FieldError errors={[errors.code]} />
          </Field>
        </div>
      </div>

      {/*===== Footer (fixed) =====*/}
      <footer
        className={cn(
          "flex flex-col gap-3 border-t-2 bg-popover p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
          ADMIN_TEAR,
        )}
      >
        {/* Directly above the buttons, where the eye is after pressing one. */}
        <FormAlert message={alert || undefined} />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 border-foreground/15 bg-transparent px-5 md:h-10 dark:bg-transparent"
            disabled={isPending}
            onClick={onCancel}
          >
            انصراف
          </Button>
          <Button type="submit" variant="solid" className="h-11 flex-1 md:h-10" disabled={isPending}>
            {isPending && <Spinner aria-hidden />}
            {isPending ? "داره ساخته می‌شه…" : "ساختن حساب"}
          </Button>
        </div>
      </footer>
    </form>
  );
}
