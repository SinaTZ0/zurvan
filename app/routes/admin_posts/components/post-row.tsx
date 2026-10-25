import { cn } from "cn";
import { ArrowUpLeftIcon, ImageIcon, SendIcon, Trash2Icon, Undo2Icon } from "lucide-react";
import { useState } from "react";

import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { formatNumberFa } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminBlogRow } from "~/orpc/blog/contract";
import { PublishProblems } from "~/routes/admin_posts/components/publish-problems";
import { CATEGORY_LABELS } from "~/routes/admin_posts/labels";
import { INK_OUTLINE, ROW_COLUMNS, ROW_PADDING } from "~/routes/admin_posts/surfaces";

/*===== Post Row =====*/
/**
 * One post on the plate: the cover as a small print (a dashed frame while a draft has none), the title that opens the
 * form, its section and length, when it went out (or was last touched, for a draft), and the buttons. The tracks are
 * `ROW_COLUMNS`.
 *
 * - **Draft:** a quiet dashed «پیش‌نویس» chip beside the title, and «انتشار». A refused publish leaves what is missing
 *   under the row (`problems`).
 * - **Published:** no chip (published is the normal state); the date line says «منتشر شد», and «دیدن» opens the live
 *   page in a new tab beside «لغو انتشار».
 * - A status that changed under her is stamped: the chip when it appears, the «منتشر شد» line when it does.
 */
export function PostRow({
  post,
  statusLocked,
  statusPending,
  problems,
  riseDelay,
  onPublish,
  onUnpublish,
  onDelete,
  onCloseProblems,
}: {
  post: AdminBlogRow;
  /** A status change is in flight somewhere: every publish button waits. */
  statusLocked: boolean;
  /** This row's status change is the one in flight (its button shows the spinner). */
  statusPending: boolean;
  /** What a refused publish said is missing, by field. */
  problems: Record<string, string> | undefined;
  /** Set when the list just changed under a filter: the row rises in after this many seconds. */
  riseDelay: number | undefined;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  onCloseProblems: () => void;
}) {
  const published = post.status === "published";

  /*------ Changed Since Mount ------*/
  // Only a status that changed under her is stamped; one that loads with the page is simply there. React's "adjust
  // state while rendering" pattern, so the stamp starts in the same paint as the new status.
  const [seenStatus, setSeenStatus] = useState(post.status);
  const [statusChanged, setStatusChanged] = useState(false);
  if (post.status !== seenStatus) {
    setSeenStatus(post.status);
    setStatusChanged(true);
  }

  const dateLabel = published ? "منتشر شد" : "آخرین ویرایش";
  const date = formatJalaliTimestamp(published && post.publishedAt ? post.publishedAt : post.updatedAt);

  return (
    <li
      data-post={post.id}
      className={cn("py-3 md:py-2.5", riseDelay !== undefined && "answer-in")}
      style={riseDelay !== undefined ? ({ "--answer-delay": `${riseDelay}s` } as React.CSSProperties) : undefined}
    >
      <div className={cn("items-center", ROW_COLUMNS, ROW_PADDING)}>
        {/*===== Cover =====*/}
        {post.coverThumb ? (
          <img
            src={post.coverThumb}
            alt=""
            width={480}
            height={270}
            loading="lazy"
            className="aspect-video w-full self-start rounded-lg object-cover ring-1 ring-foreground/15 [grid-area:cover] md:self-center"
          />
        ) : (
          <span className="flex aspect-video w-full items-center justify-center self-start rounded-lg border border-dashed border-foreground/20 text-muted-foreground/70 [grid-area:cover] md:self-center">
            <ImageIcon aria-hidden strokeWidth={1.5} className="size-5" />
            <span className="sr-only">بدون عکس</span>
          </span>
        )}

        {/*===== The Post =====*/}
        <div className="min-w-0 self-center [grid-area:text]">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              to="/admin/blog/$id/edit"
              params={{ id: post.id }}
              className="min-w-0 rounded-sm text-base leading-6 font-bold text-balance outline-none hover:underline hover:decoration-foreground/40 hover:underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {post.title}
            </Link>
            {!published && <DraftChip stamp={statusChanged} />}
            {post.hasEnglish && (
              <span
                title="نسخه‌ی انگلیسی هم داره"
                className="inline-flex h-5 shrink-0 items-center rounded-md border border-foreground/20 px-1.5 text-[11px] leading-none font-bold text-foreground/75"
              >
                <bdi dir="ltr" lang="en">
                  EN
                </bdi>
                <span className="sr-only">، نسخه‌ی انگلیسی داره</span>
              </span>
            )}
          </div>

          <p className="mt-1 text-xs leading-5 text-pretty text-muted-foreground">
            {CATEGORY_LABELS[post.category]}،{" "}
            {post.wordCount > 0 ? `${formatNumberFa(post.wordCount)} کلمه` : "هنوز متن نداره"}
          </p>
          {/* Below `xl` the date joins the facts; from `xl` it has its own track. */}
          <p className="text-xs leading-5 text-muted-foreground xl:hidden">
            <span key={post.status} className={cn("inline-block", statusChanged && "ap-stamp")}>
              {dateLabel}
            </span>{" "}
            <span className="text-foreground/80 tabular-nums">{date}</span>
          </p>
        </div>

        {/*===== Date =====*/}
        <p className="hidden flex-col self-center text-sm [grid-area:date] xl:flex">
          <span
            key={post.status}
            className={cn("text-xs text-muted-foreground [--pop-origin:0_50%]", statusChanged && "ap-stamp")}
          >
            {dateLabel}
          </span>
          <span className="text-foreground/90 tabular-nums">{date}</span>
        </p>

        {/*===== Actions =====*/}
        <div className="mt-3 flex gap-2 [grid-area:acts] md:mt-0 md:justify-end md:self-center">
          <Link
            to="/admin/blog/$id/edit"
            params={{ id: post.id }}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: cn(INK_OUTLINE, "h-11 flex-1 px-2.5 md:h-10 md:flex-none md:px-3"),
            })}
          >
            ویرایش
          </Link>

          {published ? (
            <>
              {/* A new tab, so the list stays where she was. */}
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                target="_blank"
                rel="noopener"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: cn(INK_OUTLINE, "h-11 flex-1 px-2.5 md:h-10 md:flex-none md:px-3"),
                })}
              >
                دیدن
                <ArrowUpLeftIcon aria-hidden data-icon="inline-end" />
                <span className="sr-only">(توی برگه‌ی تازه)</span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-11 flex-1 px-2 text-muted-foreground hover:text-foreground md:h-10 md:flex-none md:px-3"
                disabled={statusLocked}
                onClick={onUnpublish}
              >
                {statusPending ? <Spinner aria-hidden /> : <Undo2Icon aria-hidden />}
                لغو انتشار
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(INK_OUTLINE, "h-11 flex-1 px-2.5 md:h-10 md:flex-none md:px-3")}
              disabled={statusLocked}
              onClick={onPublish}
            >
              {statusPending ? <Spinner aria-hidden /> : <SendIcon aria-hidden className="rtl:-scale-x-100" />}
              انتشار
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`حذف ${post.title}`}
            title="حذف"
            className="size-11 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive md:size-10"
            onClick={onDelete}
          >
            <Trash2Icon aria-hidden strokeWidth={1.75} />
          </Button>
        </div>
      </div>

      {/*===== Refused Publish =====*/}
      {problems && <PublishProblems postId={post.id} fields={problems} onClose={onCloseProblems} />}
    </li>
  );
}

/*===== Draft Chip =====*/
/** «پیش‌نویس» in a quiet dashed ink outline: not a warning, just not out yet. Stamped when an unpublish brings it. */
function DraftChip({ stamp }: { stamp: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-md border border-dashed border-foreground/35 px-1.5 text-xs leading-none text-foreground/75",
        stamp && "ap-stamp",
      )}
    >
      پیش‌نویس
    </span>
  );
}
