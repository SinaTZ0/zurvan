import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { CircleAlertIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { useAdminAction } from "~/hooks/use-admin-action";
import { ADMIN_HAIRLINE, ADMIN_PLATE, ADMIN_TEAR } from "~/lib/admin-plate";
import { formatNumberFa, toLatinDigits, toPersianDigits } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import { client } from "~/orpc/client";
import type { AdminSetting } from "~/orpc/setting/contract";
import { PopText } from "~/routes/admin_settings/components/pop-text";
import { createSettingFormSchema, type SettingFormInput, type SettingFormValues } from "~/routes/admin_settings/schema";
import { invalidSettingMessage, SETTING_COPY } from "~/routes/admin_settings/setting-copy";

/*===== Constants =====*/
/**
 * The plate's two columns from `xl`: the words at the start, the number and its sentence at the end (a little wider,
 * since the sentence is the plate's point). The foot reuses them through `subgrid`, so the default sits under the words
 * and «ذخیره» under the sentence. Below `xl` everything stacks: beside the rail the content is only about 740px at 1024.
 */
const COLUMNS = "xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]";

/** Where the tear runs at `xl`: the end of the first column (5 of 11 parts). */
const TEAR_AT = "start-[calc(5/11*100%)]";
const NOTCH_AT = "start-[calc(5/11*100%-0.625rem)]";

/**
 * A half-round bite out of the plate's edge where the tear meets it (Payments' slip notch): a disc of the page's own
 * paper over the edge, the part outside clipped by the plate's `overflow-hidden`.
 */
const NOTCH = "pointer-events-none absolute size-5 rounded-full border border-foreground/10 bg-background paper-grain";

/** The ink outline (Batch 2 and 3's): a pencil line on the plate, not a second main button. */
const INK_OUTLINE =
  "border-foreground/15 bg-transparent hover:bg-foreground/5 dark:border-foreground/15 dark:bg-transparent";

/** What he types is shown in Persian digits whatever his keyboard; the schema reads every kind. */
const toShown = (raw: string) => toPersianDigits(toLatinDigits(raw));

/*===== Setting Plate =====*/
/**
 * One setting as one wide plate, torn in two like a slip: at the start its name, what it does and its default with
 * «برگردوندن به پیش‌فرض»; at the end the number in Estedad, and under it one sentence that says what the typed number
 * will do, recomputed on every keystroke (the sentence is the preview, its worked-out values pop as they change). A
 * number that can't be saved replaces that sentence with the field's error, so the line under the input never says two
 * things.
 *
 * Saves this one setting only. «ذخیره» is an ink outline until the number differs from the saved one, then the plate's
 * one gold button; after a save «ذخیره شد» is stamped beside the API's «آخرین تغییر». «برگردوندن به پیش‌فرض» fills the
 * field and does not save: saving stays a deliberate click.
 */
export function SettingPlate({ setting, busy }: { setting: AdminSetting; busy: boolean }) {
  const copy = SETTING_COPY[setting.key];
  const fieldId = `setting-${setting.key}`;
  const messageId = `${fieldId}-message`;
  const rangeId = `${fieldId}-range`;

  /*------ Form ------*/
  const schema = useMemo(
    () =>
      createSettingFormSchema({
        min: setting.min,
        max: setting.max,
        message: invalidSettingMessage({ min: setting.min, max: setting.max }),
      }),
    [setting.min, setting.max],
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
    defaultValues: { value: toShown(String(setting.value)) },
  });
  const field = register("value");

  /*------ Save ------*/
  // Bumped by each save, so the stamp remounts and lands again; cleared as soon as he changes the number.
  const [stamp, setStamp] = useState(0);
  const save = useAdminAction({
    mutationFn: (value: number) => client.setting.admin.update({ key: setting.key, value }),
    success: "ذخیره شد",
    // The failure is shown here on the plate, under the field or in the alert.
    toastFailure: false,
    failureFallback: "ذخیره نشد. دوباره امتحان کن.",
    onSuccess: () => setStamp((count) => count + 1),
  });

  // After a save the loader returns the stored number: the field follows it, and shows it as unchanged.
  useEffect(() => {
    reset({ value: toShown(String(setting.value)) });
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
  const alertMessage = save.failure?.message ?? undefined;

  // «ذخیره» stays focusable while it is quiet, so it no longer blocks Enter's implicit submit: the same rule is kept
  // here, nothing is sent for an unchanged number or while a save is in flight.
  const onSubmit = handleSubmit(({ value }) => {
    if (save.isPending || value === setting.value) return;
    save.run(value);
  });

  return (
    <form
      method="post"
      onSubmit={onSubmit}
      noValidate
      aria-busy={busy}
      className={cn(ADMIN_PLATE, "relative grid overflow-hidden transition-opacity", COLUMNS, busy && "opacity-60")}
    >
      {/* The tear between the words and the number, top to bottom from `xl`, with a notch at each end; below `xl` it
          runs across, as the number's top edge. */}
      <span aria-hidden className={cn("absolute inset-y-0 hidden border-s xl:block", ADMIN_TEAR, TEAR_AT)} />
      <span aria-hidden className={cn(NOTCH, NOTCH_AT, "-top-2.5 hidden xl:block")} />
      <span aria-hidden className={cn(NOTCH, NOTCH_AT, "-bottom-2.5 hidden xl:block")} />

      {/*===== Words =====*/}
      <div className="p-5 xl:p-6">
        <h3 className="text-base font-bold">
          <label htmlFor={fieldId}>{copy.name}</label>
        </h3>
        <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{copy.description}</p>
        {copy.notes.length > 0 && (
          <ul className="mt-3 grid gap-1.5 text-sm text-pretty text-muted-foreground">
            {copy.notes.map((note) => (
              <li key={note} className="flex gap-2">
                <span aria-hidden className="mt-2.5 h-px w-2.5 shrink-0 bg-muted-foreground/60" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/*===== Number =====*/}
      {/* Centred from `xl`, so a plate whose words run long doesn't leave the number hanging over an empty foot. */}
      <div
        className={cn(
          "relative border-t px-5 pt-5 pb-6 xl:flex xl:flex-col xl:justify-center xl:border-t-0 xl:p-6 xl:ps-8",
          ADMIN_TEAR,
        )}
      >
        <span aria-hidden className={cn(NOTCH, "-start-2.5 -top-2.5 xl:hidden")} />
        <span aria-hidden className={cn(NOTCH, "-end-2.5 -top-2.5 xl:hidden")} />

        {/*------ Field ------*/}
        <div className="flex items-center gap-3">
          <Input
            id={fieldId}
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            className="h-16 w-28 rounded-2xl text-center font-display text-4xl font-extrabold tabular-nums md:text-4xl"
            aria-invalid={!!errorMessage}
            aria-describedby={`${rangeId} ${messageId}`}
            {...field}
            onChange={(event) => {
              // Persian digits as he types, with the caret where it was (each digit stays one character).
              const input = event.currentTarget;
              const shown = toShown(input.value);
              if (shown !== input.value) {
                const caret = input.selectionStart;
                input.value = shown;
                if (caret !== null) input.setSelectionRange(caret, caret);
              }
              save.reset();
              setStamp(0);
              void field.onChange(event);
            }}
          />
          <div className="min-w-0">
            <p className="text-base font-bold">{copy.unit}</p>
            <p id={rangeId} className="text-xs text-muted-foreground">
              از {formatNumberFa(setting.min)} تا {formatNumberFa(setting.max)}
            </p>
          </div>
        </div>

        {/*------ Live Sentence or Error ------*/}
        {errorMessage ? (
          <p
            key={errorMessage}
            id={messageId}
            role="alert"
            className="answer-in mt-4 flex items-start gap-1.5 text-sm text-pretty text-destructive"
          >
            <CircleAlertIcon aria-hidden strokeWidth={1.8} className="mt-0.5 size-4 shrink-0" />
            {errorMessage}
          </p>
        ) : (
          <p id={messageId} className="mt-4 text-base leading-8 text-pretty text-foreground">
            {number !== null &&
              copy
                .liveSentence(number)
                .map((part, index) => (typeof part === "string" ? part : <PopText key={index} text={part.value} />))}
          </p>
        )}

        {/*------ Server Alert ------*/}
        {alertMessage && (
          <div key={alertMessage} className="answer-in mt-4">
            <FormAlert message={alertMessage} />
          </div>
        )}
      </div>

      {/*===== Foot =====*/}
      <div
        className={cn(
          "col-span-full grid border-t sm:grid-cols-[auto_minmax(0,1fr)] xl:grid-cols-subgrid",
          ADMIN_HAIRLINE,
        )}
      >
        {/*------ Default ------*/}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 pt-3 sm:py-3 xl:px-6">
          <p className="text-sm text-muted-foreground">
            پیش‌فرض: <span className="font-bold text-foreground">{copy.formatValue(setting.defaultValue)}</span>
          </p>
          {/* Stays focusable when it goes quiet, so his focus isn't dropped once the field holds the default. */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            focusableWhenDisabled
            disabled={isDefault}
            className="-ms-3 text-muted-foreground hover:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
            onClick={() => {
              save.reset();
              setStamp(0);
              setValue("value", toShown(String(setting.defaultValue)), { shouldValidate: true });
            }}
          >
            <RotateCcwIcon aria-hidden />
            برگردوندن به پیش‌فرض
          </Button>
        </div>

        {/*------ Save ------*/}
        <div className="flex flex-col gap-3 px-5 pt-2 pb-5 sm:flex-row sm:items-center sm:justify-between sm:py-3 xl:ps-8 xl:pe-6">
          <div className="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1">
            {stamp > 0 && (
              <span
                key={stamp}
                className="as-stamp inline-flex items-center rounded-lg border-[3px] border-double border-success px-2.5 font-display text-base font-black text-success"
              >
                ذخیره شد
              </span>
            )}
            <p className="text-sm text-muted-foreground">
              {setting.updatedAt ? `آخرین تغییر: ${formatJalaliTimestamp(setting.updatedAt)}` : "هنوز عوض نشده"}
            </p>
          </div>

          <Button
            type="submit"
            variant={isChanged || save.isPending ? "solid" : "outline"}
            size="sm"
            // Focus stays on it through the save (it is disabled while pending), so the keyboard isn't sent to the top.
            focusableWhenDisabled
            className={cn(
              "h-11 w-full sm:h-10 sm:w-auto sm:min-w-28 data-disabled:pointer-events-none",
              !isChanged && !save.isPending && cn(INK_OUTLINE, "text-muted-foreground"),
            )}
            disabled={!isChanged || save.isPending}
          >
            {save.isPending && <Spinner aria-hidden />}
            {save.isPending ? "ذخیره…" : "ذخیره"}
          </Button>
        </div>
      </div>
    </form>
  );
}
