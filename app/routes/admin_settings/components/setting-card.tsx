import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { useAdminAction } from "~/hooks/use-admin-action";
import { formatNumberFa } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import { client } from "~/orpc/client";
import type { AdminSetting } from "~/orpc/setting/contract";
import { SETTING_DEFINITIONS } from "~/orpc/setting/constants";
import { createSettingFormSchema, type SettingFormInput, type SettingFormValues } from "~/routes/admin_settings/schema";
import { SETTING_COPY } from "~/routes/admin_settings/setting-copy";

/*===== Setting Card =====*/
/**
 * One setting: its name and what it does, a number field with its unit, and one sentence under the field that says what
 * the typed number will do, recomputed on every keystroke (the sentence is the preview). A number that can't be saved
 * turns that same sentence into the field's error, so the line under the input never says two things.
 *
 * Saves this one setting only. «برگرداندن به پیش‌فرض» fills the field and does not save: saving stays a deliberate click.
 */
export function SettingCard({ setting, busy }: { setting: AdminSetting; busy: boolean }) {
  const copy = SETTING_COPY[setting.key];
  const fieldId = `setting-${setting.key}`;
  const messageId = `${fieldId}-message`;

  /*------ Form ------*/
  const schema = useMemo(
    () =>
      createSettingFormSchema({
        min: setting.min,
        max: setting.max,
        message: SETTING_DEFINITIONS[setting.key].invalidMessage,
      }),
    [setting.key, setting.min, setting.max],
  );
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SettingFormInput, unknown, SettingFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { value: String(setting.value) },
  });

  /*------ Save ------*/
  const save = useAdminAction({
    mutationFn: (value: number) => client.setting.admin.update({ key: setting.key, value }),
    success: "ذخیره شد",
    // The failure is shown here in the card, under the field or in the alert.
    toastFailure: false,
    failureFallback: "ذخیره نشد. دوباره امتحان کن.",
  });

  // After a save the loader returns the stored number: the field follows it, and shows it as unchanged.
  useEffect(() => {
    reset({ value: String(setting.value) });
  }, [reset, setting.value]);

  /*------ Live Value ------*/
  // The sentence, the save button and the reset button all read the same parse of what is typed right now.
  const typed = useWatch({ control, name: "value" });
  const parsed = schema.safeParse({ value: typed });
  const number = parsed.success ? parsed.data.value : null;
  const isChanged = number !== null && number !== setting.value;
  const isDefault = number === setting.defaultValue;

  // A local error wins; a refusal from the server stays until he types again.
  const errorMessage = errors.value?.message ?? save.failure?.fields.value;

  const onSubmit = handleSubmit(({ value }) => save.run(value));

  return (
    <form
      method="post"
      onSubmit={onSubmit}
      noValidate
      aria-busy={busy}
      className={cn("max-w-xl rounded-2xl border border-border bg-card p-5 transition-opacity", busy && "opacity-60")}
    >
      {/*===== Name and Words =====*/}
      <label htmlFor={fieldId} className="block font-extrabold">
        {copy.name}
      </label>
      <p className="mt-1 text-sm text-pretty text-muted-foreground">{copy.description}</p>
      {copy.notes.map((note) => (
        <p key={note} className="mt-1 text-sm text-pretty text-muted-foreground">
          {note}
        </p>
      ))}

      {/*===== Field =====*/}
      <div className="mt-4 flex items-center gap-2">
        <Input
          id={fieldId}
          dir="ltr"
          inputMode="numeric"
          autoComplete="off"
          className="h-10 w-24 text-center tabular-nums"
          aria-invalid={!!errorMessage}
          aria-describedby={messageId}
          {...register("value", { onChange: () => save.reset() })}
        />
        <span className="text-sm text-muted-foreground">{copy.unit}</span>
      </div>

      {/*------ Default ------*/}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
        <span>پیش‌فرض: {formatNumberFa(setting.defaultValue)}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isDefault}
          onClick={() => {
            save.reset();
            setValue("value", String(setting.defaultValue), { shouldValidate: true });
          }}
        >
          برگرداندن به پیش‌فرض
        </Button>
      </div>

      {/*------ Live Sentence or Error ------*/}
      <p
        id={messageId}
        role={errorMessage ? "alert" : undefined}
        className={cn("mt-2 text-sm text-pretty", errorMessage ? "text-destructive" : "text-foreground")}
      >
        {errorMessage ?? (number === null ? null : copy.liveSentence(number))}
      </p>

      <FormAlert message={save.failure?.message ?? undefined} />

      {/*===== Save =====*/}
      {/* Phones: the button first and full width; wider: the button at the end, the date at the start. */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
        <Button
          type="submit"
          size="sm"
          className="w-full sm:w-auto sm:min-w-28"
          disabled={!isChanged || save.isPending}
        >
          {save.isPending && <Spinner aria-hidden />}
          {save.isPending ? "در حال ذخیره…" : "ذخیره"}
        </Button>
        <p className="text-sm text-muted-foreground">
          {setting.updatedAt ? `آخرین تغییر: ${formatJalaliTimestamp(setting.updatedAt)}` : "هنوز عوض نشده"}
        </p>
      </div>
    </form>
  );
}
