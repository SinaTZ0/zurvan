import { ORPCError } from "@orpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import { NewspaperIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { useAdminAction } from "~/hooks/use-admin-action";
import { ADMIN_HAIRLINE, ADMIN_PLATE } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import type { BlogStatus } from "~/orpc/blog/constants";
import type { AdminBlogRow } from "~/orpc/blog/contract";
import { client, orpc } from "~/orpc/client";
import { errorDataSchema } from "~/orpc/errors";
import { DeleteDialog } from "~/routes/admin_posts/components/delete-dialog";
import { PostRow } from "~/routes/admin_posts/components/post-row";
import { PostsMotion } from "~/routes/admin_posts/components/posts-motion";
import { adminPostsSearchSchema, type StatusFilter } from "~/routes/admin_posts/search-params";
import { INK_OUTLINE, ROW_COLUMNS, ROW_PADDING } from "~/routes/admin_posts/surfaces";

/*===== Constants =====*/
const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "همه",
  draft: "پیش‌نویس",
  published: "منتشرشده",
};

/** A changed list staggers only its first rows in; the rest are simply there. */
const STAGGERED = 6;
const RISE_STEP_S = 0.05;

/*===== Queries =====*/
const postsQuery = () => orpc.blog.admin.list.queryOptions();

/*===== Route =====*/
// The guard is the layout's. Every post comes once, drafts too, most recently changed first: the trainer writes a few
// a month, so the status filter is URL state applied in the component, never a loader dep.
export const Route = createFileRoute("/admin/blog")({
  validateSearch: adminPostsSearchSchema,
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(postsQuery()),
  head: () => ({ meta: [{ title: "وبلاگ | مدیریت زروان" }] }),
  component: AdminPostsPage,
  notFoundComponent: () => <PostsError notFound />,
  errorComponent: () => <PostsError notFound={false} />,
});

/*===== Admin Posts =====*/
/**
 * F16 for the Admin: her notes, one plate of rows. A draft is hers alone until she publishes it; publishing an
 * unfinished one is refused by the server, and what is missing shows under the row with the way to the form.
 * Unpublishing takes a post off the site and back to the drafts (one click, reversible); deleting is behind a
 * confirmation, since a deleted post's address stops working for good.
 *
 * Motion only answers her: a filter change makes the rows rise in and the counts pop, a publish or unpublish stamps
 * the row's new status. Nothing moves on load.
 */
function AdminPostsPage() {
  const { data: posts, isFetching } = useSuspenseQuery(postsQuery());

  /*------ URL State ------*/
  const search = Route.useSearch();
  const status = search.status ?? "all";
  const navigate = useNavigate({ from: Route.fullPath });

  /** Replace: a filter isn't a place to go Back to. */
  function showStatus(next: StatusFilter) {
    void navigate({
      search: (prev) => ({ ...prev, status: next === "all" ? undefined : next }),
      replace: true,
      resetScroll: false,
    });
  }

  /*------ Filter Changed Since Mount ------*/
  // Rows rise in only after she picks a pill; on load they are simply there.
  const [shownStatus, setShownStatus] = useState(status);
  const [filterChanged, setFilterChanged] = useState(false);
  if (status !== shownStatus) {
    setShownStatus(status);
    setFilterChanged(true);
  }

  /*------ Derived ------*/
  const counts = useMemo(() => {
    const drafts = posts.filter((post) => post.status === "draft").length;
    return { all: posts.length, draft: drafts, published: posts.length - drafts };
  }, [posts]);
  const shown = useMemo(
    () => (status === "all" ? posts : posts.filter((post) => post.status === status)),
    [posts, status],
  );

  /*------ Publish and Unpublish ------*/
  // What a refused publish said is missing, by post. A refusal is INVALID_INPUT with `fields`, which the hook keeps
  // out of its toast; the row shows it instead.
  const [problems, setProblems] = useState<Record<string, Record<string, string>>>({});
  const [statusTarget, setStatusTarget] = useState<string | null>(null);

  const setPostStatus = useAdminAction({
    mutationFn: async ({ post, next }: { post: AdminBlogRow; next: BlogStatus }) => {
      try {
        return await client.blog.admin.setStatus({ id: post.id, status: next });
      } catch (error) {
        const fields = invalidFields(error);
        if (Object.keys(fields).length > 0) setProblems((previous) => ({ ...previous, [post.id]: fields }));
        throw error;
      }
    },
    success: (saved, { next }) =>
      next === "published" ? `«${saved.title}» منتشر شد` : `«${saved.title}» از وبلاگ برداشته شد`,
    failureFallback: "وضعیتش عوض نشد. دوباره امتحان کن.",
    onSuccess: (saved) => closeProblems(saved.id),
  });

  function changeStatus(post: AdminBlogRow, next: BlogStatus) {
    setStatusTarget(post.id);
    closeProblems(post.id);
    setPostStatus.run({ post, next });
  }

  function closeProblems(id: string) {
    setProblems((previous) => {
      if (!(id in previous)) return previous;
      const { [id]: _closed, ...rest } = previous;
      return rest;
    });
  }

  /*------ Delete ------*/
  // The target outlives the dialog's closing so its words don't blank mid-fade, and `session` remounts the dialog for
  // each opening so an old failure doesn't come back.
  const [deleteTarget, setDeleteTarget] = useState<{ post: AdminBlogRow; session: number } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const remove = useAdminAction({
    mutationFn: ({ post }: { post: AdminBlogRow }) => client.blog.admin.delete({ id: post.id }),
    success: (_deleted, { post }) => `«${post.title}» پاک شد`,
    failureFallback: "پاک نشد. دوباره امتحان کن.",
    toastFailure: false,
    onSuccess: () => setDeleteOpen(false),
    onConflict: () => setDeleteOpen(false),
  });

  return (
    <div>
      <PostsMotion />

      {/*===== Header =====*/}
      <AdminPageHeader title="وبلاگ" summary={posts.length > 0 ? describeCounts(counts) : undefined}>
        <Link to="/admin/blog/new" className={buttonVariants({ variant: "outline", className: INK_OUTLINE })}>
          <PlusIcon aria-hidden />
          نوشته‌ی تازه
        </Link>
      </AdminPageHeader>

      {posts.length === 0 ? (
        /*===== Nothing at All =====*/
        <AdminEmptyState title="هنوز نوشته‌ای نیست" icon={NewspaperIcon}>
          اولین نوشته رو بنویس. تا منتشرش نکنی فقط خودت می‌بینیش.
        </AdminEmptyState>
      ) : (
        <>
          {/*===== Filter =====*/}
          <AdminFilterPills
            label="وضعیت"
            value={status}
            onChange={showStatus}
            options={(["all", "draft", "published"] as const).map((value) => ({
              value,
              label: STATUS_LABELS[value],
              count: counts[value],
            }))}
            className="mb-4"
          />

          {shown.length === 0 ? (
            /*===== Empty Filter =====*/
            <AdminEmptyState
              title={status === "draft" ? "پیش‌نویسی نمونده" : "هنوز چیزی منتشر نشده"}
              icon={NewspaperIcon}
            >
              {status === "draft"
                ? "هر چی نوشتی منتشر شده. «نوشته‌ی تازه» یه پیش‌نویس می‌سازه که تا منتشرش نکنی همین‌جا می‌مونه."
                : "پیش‌نویس‌هات توی «پیش‌نویس» هستن؛ یکی رو تکمیل کن و «انتشار» رو بزن تا توی وبلاگ بیاد."}
            </AdminEmptyState>
          ) : (
            /*===== The Posts =====*/
            // The dim waits a moment, so the short reload after each write doesn't flash the list.
            <section
              aria-labelledby="admin-posts-list"
              aria-busy={isFetching}
              className={cn("transition-opacity", isFetching ? "opacity-60 delay-150" : "delay-0")}
            >
              <h2 id="admin-posts-list" className="sr-only">
                نوشته‌ها
              </h2>
              <div className={ADMIN_PLATE}>
                {/*------ Column Head ------*/}
                {/* Only where the row is one line in fixed tracks; the rows say the same to a screen reader. */}
                <div
                  aria-hidden
                  className={cn(
                    ROW_COLUMNS,
                    ROW_PADDING,
                    ADMIN_HAIRLINE,
                    "hidden border-b py-2.5 text-xs text-muted-foreground xl:grid",
                  )}
                >
                  <span className="[grid-area:cover]">نوشته</span>
                  <span className="[grid-area:date]">تاریخ</span>
                </div>

                {/*------ Rows ------*/}
                <ol key={status} className={cn("divide-y", ADMIN_HAIRLINE)}>
                  {shown.map((post, index) => (
                    <PostRow
                      key={post.id}
                      post={post}
                      statusLocked={setPostStatus.isPending}
                      statusPending={setPostStatus.isPending && statusTarget === post.id}
                      problems={problems[post.id]}
                      riseDelay={filterChanged ? Math.min(index, STAGGERED) * RISE_STEP_S : undefined}
                      onPublish={() => changeStatus(post, "published")}
                      onUnpublish={() => changeStatus(post, "draft")}
                      onDelete={() => {
                        setDeleteTarget((previous) => ({ post, session: (previous?.session ?? 0) + 1 }));
                        setDeleteOpen(true);
                      }}
                      onCloseProblems={() => closeProblems(post.id)}
                    />
                  ))}
                </ol>
              </div>
            </section>
          )}
        </>
      )}

      {/*===== Confirm Delete =====*/}
      {deleteTarget && (
        <DeleteDialog
          key={deleteTarget.session}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          post={deleteTarget.post}
          isPending={remove.isPending}
          failure={remove.failure?.message ?? undefined}
          onConfirm={() => remove.run({ post: deleteTarget.post })}
        />
      )}
    </div>
  );
}

/*===== Summary =====*/
/** «۳ نوشته منتشرشده، ۱ پیش‌نویس»; the drafts only when there are some. */
function describeCounts(counts: { draft: number; published: number }): string {
  const published = `${formatNumberFa(counts.published)} نوشته منتشرشده`;
  return counts.draft > 0 ? `${published}، ${formatNumberFa(counts.draft)} پیش‌نویس` : published;
}

/*===== Refusals =====*/
/** The field messages of an `INVALID_INPUT` refusal; empty for any other failure. */
function invalidFields(error: unknown): Record<string, string> {
  if (!(error instanceof ORPCError) || error.code !== "INVALID_INPUT") return {};
  const parsed = errorDataSchema.safeParse(error.data);
  return parsed.success ? parsed.data.fields : {};
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the rail and tabs stay.
function PostsError({ notFound }: { notFound: boolean }) {
  return (
    <div>
      <AdminPageHeader
        title={notFound ? "این صفحه پیدا نشد" : "وبلاگ باز نشد"}
        summary="یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."
      />
      <Link to="/admin" className={buttonVariants({ variant: "outline", className: INK_OUTLINE })}>
        برگرد به نمای کلی
      </Link>
    </div>
  );
}
