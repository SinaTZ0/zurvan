import { zodResolver } from "@hookform/resolvers/zod";
import { ORPCError } from "@orpc/client";
import { useIsFetching } from "@tanstack/react-query";
import { useBlocker, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import { ArrowUpLeftIcon, EyeIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { useAdminAction } from "~/hooks/use-admin-action";
import type { BlogBody } from "~/lib/blog-body";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminBlogPost, BlogInput } from "~/orpc/blog/contract";
import { client, orpc } from "~/orpc/client";
import { errorDataSchema } from "~/orpc/errors";
import type { AdminCourse } from "~/orpc/course/contract";
import type { Media } from "~/orpc/media/contract";
import { CoverSection } from "~/routes/admin_post_form/components/cover-section";
import { DetailsSection } from "~/routes/admin_post_form/components/details-section";
import { type EnglishParts, EnglishSection } from "~/routes/admin_post_form/components/english-section";
import { LeaveDialog } from "~/routes/admin_post_form/components/leave-dialog";
import { PostAside } from "~/routes/admin_post_form/components/post-aside";
import { PreviewDialog } from "~/routes/admin_post_form/components/preview-dialog";
import {
  bodyFingerprint,
  bodyIsWritten,
  bodyWordCount,
  buildPreviewPost,
} from "~/routes/admin_post_form/components/preview-post";
import { SaveBar } from "~/routes/admin_post_form/components/save-bar";
import { TextSection } from "~/routes/admin_post_form/components/text-section";
import { useStickyColumn } from "~/routes/admin_post_form/hooks/use-sticky-column";
import {
  forgetPublishProblems,
  handOffPublishProblems,
  peekPublishProblems,
} from "~/routes/admin_post_form/publish-handoff";
import {
  type PostFormInput,
  type PostFormValues,
  formFieldFor,
  postFormSchema,
  slugFromEnglishTitle,
  toBlogInput,
  toFormDefaults,
} from "~/routes/admin_post_form/schema";
import { POST_FORM_SECTIONS, type PostFormSectionId } from "~/routes/admin_post_form/sections";
import { INK_OUTLINE } from "~/routes/admin_post_form/surfaces";

/*===== Types =====*/
type SaveRequest = { input: BlogInput; publish: boolean };

type SaveResult = {
  saved: AdminBlogPost;
  published: boolean;
  /** «ذخیره و انتشار» saved the post but the server refused to publish it: what is missing, by field. */
  publishProblems: Record<string, string> | null;
  /** The publish failed for another reason (the network): the post is saved, the toast says so. */
  publishFailed: boolean;
};

type BodyField = "body" | "bodyEn";

/*===== Post Form =====*/
/**
 * The page that writes a post (`post` is null) or edits one (F16): four plates (the text with its editor, the cover,
 * the details, the English), the column «این نوشته» beside them (under them on phones), and the save bar.
 *
 * - **Saving** a new post creates a draft and moves to its edit address; saving an existing one stays, so a long text
 *   is saved often. A failure keeps every input, puts the server's messages next to their fields and the rest in the
 *   bar's alert.
 * - **«ذخیره و انتشار»** (a draft) saves, then publishes. A refused publish leaves the post saved and shows what is
 *   missing as field messages (handed to the edit form when the post was new).
 * - **A published post** says that a save is public at once; it can't be saved unfinished (the server refuses it).
 * - **Leaving** with unsaved changes asks first (`useBlocker`; the browser asks on a reload or a closed tab).
 * - **«پیش‌نمایش»** opens the article as readers will see it, from the unsaved values.
 *
 * The bodies are the editors' JSON. They don't take part in the form library's dirty check (the editor's JSON never
 * equals the stored body field for field): a fingerprint of their stored form against the loaded one says whether they
 * changed.
 */
export function PostForm({ post, courses }: { post: AdminBlogPost | null; courses: AdminCourse[] }) {
  const isNew = post === null;
  const navigate = useNavigate();
  const form = useForm<PostFormInput, unknown, PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: toFormDefaults(post),
  });
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    getFieldState,
    reset,
    formState: { errors, dirtyFields, isSubmitted },
  } = form;

  /*------ Bodies ------*/
  // What each body was when loaded (or last saved), and whether it differs now. The word count and the English body's
  // state are read from the same change, so the form doesn't watch the bodies.
  const baselines = useRef({
    body: bodyFingerprint(post?.body ?? null),
    bodyEn: bodyFingerprint(post?.english.body ?? null),
  });
  const [bodiesChanged, setBodiesChanged] = useState({ body: false, bodyEn: false });
  const [wordCount, setWordCount] = useState(post?.wordCount ?? 0);
  const [englishBodyWritten, setEnglishBodyWritten] = useState(Boolean(post?.english.body));

  const changeBody = useCallback(
    (field: BodyField, json: unknown) => {
      setValue(field, json);
      if (getFieldState(field).error) clearErrors(field);
      const changed = bodyFingerprint(json) !== baselines.current[field];
      setBodiesChanged((previous) => (previous[field] === changed ? previous : { ...previous, [field]: changed }));
      if (field === "body") setWordCount(bodyWordCount(json));
      else setEnglishBodyWritten(bodyIsWritten(json));
    },
    [setValue, getFieldState, clearErrors],
  );
  const changePersianBody = useCallback((json: unknown) => changeBody("body", json), [changeBody]);
  const changeEnglishBody = useCallback((json: unknown) => changeBody("bodyEn", json), [changeBody]);

  // The editors start from these once; later renders must not hand them a new object.
  const [initialBodies] = useState(() => ({
    body: (post?.body ?? null) as BlogBody | null,
    bodyEn: (post?.english.body ?? null) as BlogBody | null,
  }));

  /*------ Cover ------*/
  // The form submits only the photo's id; the print and the preview need its addresses.
  const [uploadedCover, setUploadedCover] = useState<Media | null>(null);
  // Saving mid-upload would leave out the photo that is still on its way.
  const [uploading, setUploading] = useState(false);

  /*------ Address Follows the English Title ------*/
  // Only for a new post, until she types in the address herself: a Persian title has no sensible Latin form.
  const [slugTyped, setSlugTyped] = useState(!isNew);
  const titleEn = useWatch({ control, name: "titleEn" }) ?? "";
  useEffect(() => {
    if (slugTyped) return;
    setValue("slug", slugFromEnglishTitle(titleEn), { shouldDirty: true, shouldValidate: isSubmitted });
  }, [titleEn, slugTyped, setValue, isSubmitted]);

  /*------ Save ------*/
  const [publishing, setPublishing] = useState(false);
  // A new post whose publish was refused arrives here with what is missing (`publish-handoff.ts`).
  const [publishRefusal, setPublishRefusal] = useState<Record<string, string> | null>(() =>
    post ? (peekPublishProblems(post.id) ?? null) : null,
  );
  // Set once the form is about to leave on purpose (a new post moving to its edit address), so the blocker lets it.
  const leaving = useRef(false);

  const save = useAdminAction({
    mutationFn: async ({ input, publish }: SaveRequest): Promise<SaveResult> => {
      const saved = post
        ? await client.blog.admin.update({ ...input, id: post.id })
        : await client.blog.admin.create(input);
      if (!publish) return { saved, published: false, publishProblems: null, publishFailed: false };
      try {
        const published = await client.blog.admin.setStatus({ id: saved.id, status: "published" });
        return { saved: published, published: true, publishProblems: null, publishFailed: false };
      } catch (error) {
        // The save stands either way: a new post now exists, so the error must not leave the form on «new».
        const fields = invalidFields(error);
        const refused = Object.keys(fields).length > 0;
        return { saved, published: false, publishProblems: refused ? fields : null, publishFailed: !refused };
      }
    },
    success: (result) =>
      result.published
        ? `«${result.saved.title}» منتشر شد`
        : result.publishProblems
          ? "ذخیره شد؛ برای انتشار چند چیز مونده"
          : result.publishFailed
            ? "ذخیره شد، ولی منتشر نشد. دوباره «ذخیره و انتشار» رو بزن."
            : isNew
              ? "پیش‌نویس ساخته شد"
              : "ذخیره شد",
    failureFallback: "ذخیره نشد. دوباره امتحان کن.",
    // The form shows the failure itself (fields and alert), so a toast would say it twice.
    toastFailure: false,
    onSuccess: (result) => {
      if (isNew) {
        if (result.publishProblems) handOffPublishProblems({ id: result.saved.id, fields: result.publishProblems });
        leaving.current = true;
        void navigate({ to: "/admin/blog/$id/edit", params: { id: result.saved.id }, replace: true });
        return;
      }
      // What was saved is the new starting point: nothing is left to save, and the leave question stops.
      reset(toFormDefaults(result.saved));
      baselines.current = {
        body: bodyFingerprint(result.saved.body),
        bodyEn: bodyFingerprint(result.saved.english.body),
      };
      setBodiesChanged({ body: false, bodyEn: false });
      setUploadedCover(null);
      if (result.publishProblems) setPublishRefusal(result.publishProblems);
    },
    // The post is gone (NOT_FOUND): the hook has toasted why; there is nothing left to edit.
    onConflict: () => {
      leaving.current = true;
      void navigate({ to: "/admin/blog" });
    },
  });

  function submitWith(publish: boolean) {
    return handleSubmit(
      (values) => {
        save.reset();
        setPublishRefusal(null);
        setPublishing(publish);
        save.run({ input: toBlogInput(values), publish });
      },
      () => focusFirstInvalid(),
    );
  }
  const onSubmit = submitWith(false);

  /*------ Server Messages ------*/
  // The API validates again; its per-field messages go next to the field. A field the form doesn't have (it shouldn't
  // happen) is added to the alert instead of being lost. A refused publish's messages are shown the same way.
  const { failure } = save;
  useEffect(() => {
    const fields = { ...failure?.fields, ...publishRefusal };
    if (Object.keys(fields).length === 0) return;
    for (const [field, message] of Object.entries(fields)) {
      const target = formFieldFor(field);
      if (target) setError(target, { message });
    }
    focusFirstInvalid();
  }, [failure, publishRefusal, setError]);

  // Once shown, the handed-over refusal is this form's state; a later visit to the post starts clean.
  useEffect(() => {
    if (post) forgetPublishProblems(post.id);
  }, [post]);

  const orphanMessages = Object.entries({ ...failure?.fields, ...publishRefusal })
    .filter(([field]) => formFieldFor(field) === null)
    .map(([, message]) => message);
  const alert = [
    failure?.message,
    publishRefusal ? "ذخیره شد، ولی هنوز منتشر نمی‌شه: پیام‌های کنار هر بخش رو ببین." : undefined,
    ...orphanMessages,
  ]
    .filter(Boolean)
    .join(" ");

  /*------ Something to Save ------*/
  const isDirty =
    Object.keys(dirtyFields).length > 0 || bodiesChanged.body || bodiesChanged.bodyEn || uploadedCover !== null;

  /*------ Leaving With Changes ------*/
  // Read by the blocker when a navigation starts, so it sees the state of that moment.
  const mayBlock = useRef(false);
  useEffect(() => {
    mayBlock.current = isDirty && !save.isPending;
  }, [isDirty, save.isPending]);
  const blocker = useBlocker({
    // Jumping to a plate (`#post-plate-…`) stays on the page, so only a new path asks.
    shouldBlockFn: ({ current, next }) => mayBlock.current && !leaving.current && current.pathname !== next.pathname,
    enableBeforeUnload: () => mayBlock.current && !leaving.current,
    withResolver: true,
  });

  /*------ Plates With a Message ------*/
  const invalidSections = new Set<PostFormSectionId>(
    POST_FORM_SECTIONS.filter((section) => section.fields.some((field) => errors[field])).map((section) => section.id),
  );

  /*------ English ------*/
  const [excerptEn, coverAltEn, slug] = useWatch({ control, name: ["excerptEn", "coverAltEn", "slug"] });
  const englishParts: EnglishParts = {
    title: titleEn.trim() !== "",
    excerpt: (excerptEn ?? "").trim() !== "",
    coverAlt: (coverAltEn ?? "").trim() !== "",
    body: englishBodyWritten,
  };
  const englishWritten = Object.values(englishParts).filter(Boolean).length;

  /*------ Refetching ------*/
  // After a save the hook refetches the API's queries; the form says it is busy while the posts are on their way.
  const busy = useIsFetching({ queryKey: orpc.blog.key() }) > 0;

  /*------ Aside ------*/
  const asideColumn = useRef<HTMLDivElement>(null);
  useStickyColumn(asideColumn);

  /*------ Preview ------*/
  const [preview, setPreview] = useState<{ open: boolean; language: "fa" | "en" } | null>(null);
  const openPreview = () => setPreview((previous) => ({ open: true, language: previous?.language ?? "fa" }));

  const published = post?.status === "published";

  return (
    <FormProvider {...form}>
      {/*===== Header =====*/}
      <AdminPageHeader title={isNew ? "نوشته‌ی تازه" : "ویرایش نوشته"} summary={summaryFor(post)}>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className={INK_OUTLINE} onClick={openPreview}>
            <EyeIcon aria-hidden strokeWidth={1.8} />
            پیش‌نمایش
          </Button>
          {published && (
            // A new tab: the form keeps what she has typed while she looks at the live page.
            <Link
              to="/blog/$slug"
              params={{ slug: post.slug }}
              target="_blank"
              rel="noopener"
              className={buttonVariants({ variant: "outline", className: INK_OUTLINE })}
            >
              دیدن صفحه
              <ArrowUpLeftIcon aria-hidden data-icon="inline-end" />
              <span className="sr-only">(توی برگه‌ی تازه)</span>
            </Link>
          )}
          <Link to="/admin/blog" className={buttonVariants({ variant: "ghost", className: "text-muted-foreground" })}>
            بازگشت به وبلاگ
          </Link>
        </div>
      </AdminPageHeader>

      {/*===== Form =====*/}
      <form
        method="post"
        onSubmit={onSubmit}
        noValidate
        aria-busy={busy}
        className={cn(
          "flex flex-col gap-5 transition-opacity xl:grid xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start xl:gap-x-6 xl:gap-y-5",
          // The dim waits a moment, so a quick reload doesn't flash the form.
          busy ? "opacity-60 delay-150" : "delay-0",
        )}
      >
        {/*===== Plates =====*/}
        {/* A saving form is inert: a disabled fieldset disables every field inside it at once (the editors follow). */}
        <fieldset disabled={save.isPending} className="flex min-w-0 flex-col gap-5 xl:col-start-1 xl:row-start-1">
          <legend className="sr-only">{isNew ? "نوشته‌ی تازه" : "ویرایش نوشته"}</legend>
          <TextSection initialBody={initialBodies.body} editable={!save.isPending} onBodyChange={changePersianBody} />
          <CoverSection
            uploaded={uploadedCover}
            currentSrc={post?.cover?.urls.card ?? null}
            onUploaded={(media) => {
              setUploadedCover(media);
              setValue("coverMediaId", media.id, { shouldDirty: true });
              clearErrors("coverMediaId");
            }}
            onBusyChange={setUploading}
            error={errors.coverMediaId?.message}
          />
          <DetailsSection
            savedSlug={post?.slug ?? null}
            everPublished={post?.publishedAt != null}
            courses={courses}
            onSlugTyped={() => setSlugTyped(true)}
          />
          <EnglishSection
            parts={englishParts}
            slug={(slug ?? "").trim()}
            live={published}
            initialBody={initialBodies.bodyEn}
            editable={!save.isPending}
            onBodyChange={changeEnglishBody}
          />
        </fieldset>

        {/*===== Aside =====*/}
        {/* Sticky beside the plates from `xl`; on phones it follows the last plate, before the save bar. */}
        <div ref={asideColumn} className="xl:sticky xl:top-24 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <PostAside
            post={post}
            slug={(slug ?? "").trim()}
            wordCount={wordCount}
            englishWritten={englishWritten}
            invalidSections={invalidSections}
            onPreview={openPreview}
          />
        </div>

        {/*===== Save Bar =====*/}
        {/* A direct child of the form, so that on phones it sticks within the whole form and not within its own row. */}
        <SaveBar
          isNew={isNew}
          live={published}
          dirty={isDirty}
          pending={save.isPending}
          publishing={save.isPending && publishing}
          uploading={uploading}
          message={alert || undefined}
          onSaveAndPublish={() => void submitWith(true)()}
          className="xl:col-start-1 xl:row-start-2"
        />
      </form>

      {/*===== Preview =====*/}
      {preview && (
        <PreviewHost
          open={preview.open}
          language={preview.language}
          post={post}
          uploadedCover={uploadedCover}
          courses={courses}
          hasEnglish={englishWritten > 0}
          onOpenChange={(open) => setPreview((previous) => previous && { ...previous, open })}
          onLanguageChange={(language) => setPreview((previous) => previous && { ...previous, language })}
        />
      )}

      {/*===== Leave? =====*/}
      <LeaveDialog
        open={blocker.status === "blocked"}
        onStay={() => blocker.reset?.()}
        onLeave={() => blocker.proceed?.()}
      />
    </FormProvider>
  );
}

/*===== Preview Host =====*/
/**
 * Watches the whole form only once the preview has been opened, and builds the article only while it is open, so
 * typing in the form doesn't rebuild a preview nobody sees.
 */
function PreviewHost({
  open,
  language,
  post,
  uploadedCover,
  courses,
  hasEnglish,
  onOpenChange,
  onLanguageChange,
}: {
  open: boolean;
  language: "fa" | "en";
  post: AdminBlogPost | null;
  uploadedCover: Media | null;
  courses: AdminCourse[];
  hasEnglish: boolean;
  onOpenChange: (open: boolean) => void;
  onLanguageChange: (language: "fa" | "en") => void;
}) {
  const values = useWatch<PostFormInput>();
  const shownLanguage = hasEnglish ? language : "fa";

  // While closed (and fading out) the article keeps what it showed: the values follow the form only while it is open.
  // React's "adjust state while rendering" pattern, so an opened preview shows the latest values in its first paint.
  const [shownValues, setShownValues] = useState(values);
  if (open && values !== shownValues) setShownValues(values);
  const previewPost = useMemo(
    () => buildPreviewPost({ values: shownValues, post, uploadedCover, courses, language: shownLanguage }),
    [shownValues, post, uploadedCover, courses, shownLanguage],
  );

  return (
    <PreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      post={previewPost}
      language={shownLanguage}
      hasEnglish={hasEnglish}
      onLanguageChange={onLanguageChange}
    />
  );
}

/*===== Summary =====*/
/** The line under the title: where the post stands, and what a save does to it. */
function summaryFor(post: AdminBlogPost | null): string {
  if (!post) return "با ذخیره پیش‌نویس می‌شه؛ تا منتشرش نکنی فقط خودت می‌بینیش.";
  if (post.status === "published" && post.publishedAt) {
    return `منتشرشده از ${formatJalaliTimestamp(post.publishedAt)}؛ هر ذخیره همون لحظه توی سایت دیده می‌شه.`;
  }
  return "پیش‌نویس؛ تا منتشرش نکنی فقط خودت می‌بینیش.";
}

/*===== Refusals =====*/
/** The field messages of an `INVALID_INPUT` refusal; empty for any other failure. */
function invalidFields(error: unknown): Record<string, string> {
  if (!(error instanceof ORPCError) || error.code !== "INVALID_INPUT") return {};
  const parsed = errorDataSchema.safeParse(error.data);
  return parsed.success ? parsed.data.fields : {};
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
