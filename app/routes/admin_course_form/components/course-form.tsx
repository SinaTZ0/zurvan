import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useIsFetching } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useAdminAction } from "~/hooks/use-admin-action";
import { client, orpc } from "~/orpc/client";
import type { AdminCourse, CourseInput } from "~/orpc/course/contract";
import type { Media } from "~/orpc/media/contract";
import { AgeSection } from "~/routes/admin_course_form/components/age-section";
import { CoverSection } from "~/routes/admin_course_form/components/cover-section";
import { FormMotion } from "~/routes/admin_course_form/components/form-motion";
import { CoursePreview } from "~/routes/admin_course_form/components/course-preview";
import { useStickyColumn } from "~/routes/admin_course_form/hooks/use-sticky-column";
import { IntroSection } from "~/routes/admin_course_form/components/intro-section";
import { PrerequisitesSection } from "~/routes/admin_course_form/components/prerequisites-section";
import { PriceSection } from "~/routes/admin_course_form/components/price-section";
import { SaveBar } from "~/routes/admin_course_form/components/save-bar";
import { EnglishSection } from "~/routes/admin_course_form/components/english-section";
import { TextSection } from "~/routes/admin_course_form/components/text-section";
import { buildPreviewCourse } from "~/routes/admin_course_form/components/preview-course";
import {
  type CourseFormInput,
  type CourseFormValues,
  FORM_FIELD_NAMES,
  SERVER_FIELD_TO_FORM,
  createCourseFormSchema,
  toCourseInput,
  toFormDefaults,
} from "~/routes/admin_course_form/schema";
import { COURSE_FORM_SECTIONS, type CourseFormSectionId } from "~/routes/admin_course_form/sections";

/*===== Types =====*/
type SaveRequest =
  | { kind: "create"; input: CourseInput & { slug: string; coverMediaId: string } }
  | { kind: "update"; input: CourseInput & { slug: string; coverMediaId?: string } };

/*===== Course Form =====*/
/**
 * The body of the page that writes a course (`course` is null) or edits one: six plates, the real catalogue card
 * beside them (under them on phones) and the save bar.
 *
 * Money is Toman here and Rial in the request. Saving toasts, goes back to Courses and leaves the Admin's list fresh;
 * a failure keeps every input, puts the server's messages next to their fields and the rest in the bar's alert.
 * `courses` is the whole catalogue, for the prerequisite choices.
 */
export function CourseForm({ course, courses }: { course: AdminCourse | null; courses: AdminCourse[] }) {
  const isNew = course === null;
  const navigate = useNavigate();
  const schema = useMemo(() => createCourseFormSchema({ isNew }), [isNew]);
  const form = useForm<CourseFormInput, unknown, CourseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormDefaults(course),
  });
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    formState: { errors, dirtyFields },
  } = form;

  /*------ Choices ------*/
  const options = useMemo(() => courses.filter((candidate) => candidate.slug !== course?.slug), [courses, course]);
  const requiredBy = useMemo(() => new Set(course?.requiredBy.map((dependent) => dependent.slug)), [course]);
  const titles = useMemo(() => new Map(courses.map((candidate) => [candidate.slug, candidate.title])), [courses]);

  /*------ Cover ------*/
  // The form submits only the photo's id; the card and the frame need its address.
  const [uploaded, setUploaded] = useState<Media | null>(null);
  // Saving mid-upload would leave out the photo that is still on its way.
  const [uploading, setUploading] = useState(false);

  /*------ Save ------*/
  const save = useAdminAction({
    mutationFn: (request: SaveRequest) =>
      request.kind === "create" ? client.course.admin.create(request.input) : client.course.admin.update(request.input),
    success: (_saved, request) => (request.kind === "create" ? "دوره ساخته شد" : "ذخیره شد"),
    failureFallback: "ذخیره نشد. دوباره امتحان کن.",
    // The form shows the failure itself (fields and alert), so a toast would say it twice.
    toastFailure: false,
    onSuccess: () => void navigate({ to: "/admin/courses" }),
    // The course is gone (NOT_FOUND): the hook has toasted why; there is nothing left to edit.
    onConflict: () => void navigate({ to: "/admin/courses" }),
  });

  const onSubmit = handleSubmit(
    (values) => {
      save.reset();
      const input = toCourseInput({ values, slug: course?.slug ?? values.slug });
      if (course) {
        // No new photo keeps the saved cover: nothing is sent for it.
        save.run({
          kind: "update",
          input: values.coverMediaId ? { ...input, coverMediaId: values.coverMediaId } : input,
        });
        return;
      }
      save.run({ kind: "create", input: { ...input, coverMediaId: values.coverMediaId ?? "" } });
    },
    () => focusFirstInvalid(),
  );

  /*------ Server Messages ------*/
  // The API validates again; its per-field messages go next to the field. A field the form doesn't have (it shouldn't
  // happen) is added to the alert instead of being lost.
  const { failure } = save;
  useEffect(() => {
    if (!failure) return;
    for (const [field, message] of Object.entries(failure.fields)) {
      const target =
        SERVER_FIELD_TO_FORM[field] ?? (FORM_FIELD_NAMES.has(field) ? (field as keyof CourseFormInput) : null);
      if (target) setError(target, { message });
    }
    focusFirstInvalid();
  }, [failure, setError]);
  const orphanMessages = Object.entries(failure?.fields ?? {})
    .filter(([field]) => !SERVER_FIELD_TO_FORM[field] && !FORM_FIELD_NAMES.has(field))
    .map(([, message]) => message);
  const alert = [failure?.message, ...orphanMessages].filter(Boolean).join(" ");

  /*------ Something to Save ------*/
  // From the fields he changed, not `isDirty`: a new course's unset family (`undefined`) reads back from its radios as
  // `null`, which `isDirty` counts as a change before he has typed anything.
  const isDirty = Object.keys(dirtyFields).length > 0;

  /*------ Plates With a Message ------*/
  const invalidSections = new Set<CourseFormSectionId>(
    COURSE_FORM_SECTIONS.filter((section) => section.fields.some((field) => errors[field])).map(
      (section) => section.id,
    ),
  );

  /*------ Refetching ------*/
  // After a save the hook refetches the API's queries before going back to Courses; the page says it is busy while
  // the courses are on their way.
  const busy = useIsFetching({ queryKey: orpc.course.key() }) > 0;

  /*------ Preview ------*/
  // A short window would hide the facts under the card behind a plain sticky `top`.
  const previewColumn = useRef<HTMLDivElement>(null);
  useStickyColumn(previewColumn);
  const values = useWatch({ control });
  const preview = buildPreviewCourse({
    values: values as Partial<CourseFormInput>,
    course,
    coverSrc: uploaded?.urls.card ?? course?.cover.src ?? null,
    titles,
  });

  return (
    <FormProvider {...form}>
      <FormMotion />
      <form
        method="post"
        onSubmit={onSubmit}
        noValidate
        aria-busy={busy}
        className={cn(
          "flex flex-col gap-5 transition-opacity xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-x-6 xl:gap-y-5",
          // The dim waits a moment, so a quick reload doesn't flash the form.
          busy ? "opacity-60 delay-150" : "delay-0",
        )}
      >
        {/*===== Plates =====*/}
        {/* A saving form is inert: a disabled fieldset disables every field inside it at once. */}
        <fieldset disabled={save.isPending} className="flex min-w-0 flex-col gap-5 xl:col-start-1 xl:row-start-1">
          <legend className="sr-only">{isNew ? "دوره‌ی تازه" : "ویرایش دوره"}</legend>
          <IntroSection slug={course?.slug ?? null} />
          <CoverSection
            uploaded={uploaded}
            currentSrc={course?.cover.src ?? null}
            onUploaded={(media) => {
              setUploaded(media);
              setValue("coverMediaId", media.id, { shouldDirty: true });
              clearErrors("coverMediaId");
            }}
            onBusyChange={setUploading}
            error={errors.coverMediaId?.message}
          />
          <AgeSection />
          <PriceSection isNew={isNew} />
          <PrerequisitesSection options={options} requiredBy={requiredBy} />
          <TextSection />
          <EnglishSection />
        </fieldset>

        {/*===== Preview =====*/}
        {/* Sticky beside the plates from `xl`; on phones it follows the last plate, before the save bar. */}
        <div ref={previewColumn} className="xl:sticky xl:top-24 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <CoursePreview
            course={preview}
            address={course?.slug ?? (values.slug ?? "").trim()}
            archived={course?.status === "archived"}
            invalidSections={invalidSections}
          />
        </div>

        {/*===== Save Bar =====*/}
        {/* A direct child of the form, so that on phones it sticks within the whole form and not within its own row. */}
        <SaveBar
          isNew={isNew}
          dirty={isDirty}
          pending={save.isPending}
          uploading={uploading}
          message={alert || undefined}
          className="xl:col-start-1 xl:row-start-2"
        />
      </form>
    </FormProvider>
  );
}

/*===== Focus =====*/
/** Brings the first field that has a message into view, after React has drawn the messages. */
function focusFirstInvalid() {
  requestAnimationFrame(() => {
    const field = document.querySelector<HTMLElement>(
      "form [aria-invalid='true'], form fieldset[data-invalid='true'] input",
    );
    field?.scrollIntoView({ block: "center" });
    field?.focus({ preventScroll: true });
  });
}
