import { FormAlert } from "~/components/form-alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Spinner } from "~/components/ui/spinner";
import type { AdminBlogRow } from "~/orpc/blog/contract";
import { DIALOG_FOOTER, DIALOG_PLATE, DIALOG_TITLE, INK_OUTLINE } from "~/routes/admin_posts/surfaces";

/*===== Delete Dialog =====*/
/**
 * «پاک بشه؟»: the one confirmation before a post is gone. Unlike a course's archive this can't be undone, so the body
 * says so plainly, and for a post that was ever public (it has a publish date, even if it is a draft again) that its
 * address and the old ones that led to it stop working: links she shared will land on «پیدا نشد». Unpublishing is
 * the reversible way, and the dialog points to it.
 *
 * Controlled. The page remounts it for each opening so an old failure doesn't come back. It can't be dismissed while
 * the write is in flight, so the outcome is never hidden.
 */
export function DeleteDialog({
  open,
  onOpenChange,
  post,
  isPending,
  failure,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: AdminBlogRow;
  isPending: boolean;
  failure: string | undefined;
  onConfirm: () => void;
}) {
  const wasPublic = post.publishedAt !== null;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent className={`${DIALOG_PLATE} data-[size=default]:sm:max-w-md`}>
        <AlertDialogHeader>
          <AlertDialogTitle className={DIALOG_TITLE}>«{post.title}» پاک بشه؟</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-6 text-pretty">
            {wasPublic ? (
              <>
                نوشته برای همیشه پاک می‌شه و نشانیش،{" "}
                <bdi dir="ltr" className="text-foreground/90">
                  /blog/{post.slug}
                </bdi>
                ، از این به بعد «پیدا نشد» نشون می‌ده؛ هر جا پیوندش رو گذاشتی دیگه کار نمی‌کنه.
                {post.status === "published" && " اگه فقط می‌خوای از سایت برداریش، «لغو انتشار» رو بزن."}
              </>
            ) : (
              "این پیش‌نویس برای همیشه پاک می‌شه و برنمی‌گرده. هیچ‌وقت منتشر نشده، پس کسی ندیدتش."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <FormAlert message={isPending ? undefined : failure} />

        <AlertDialogFooter className={DIALOG_FOOTER}>
          <AlertDialogCancel variant="outline" className={INK_OUTLINE} disabled={isPending}>
            نه، بمونه
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending && <Spinner aria-hidden />}
            برای همیشه پاکش کن
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
