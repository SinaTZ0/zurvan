import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { orpc } from "~/orpc/client";
import type { AdminBlogPost } from "~/orpc/blog/contract";
import type { AdminCourse } from "~/orpc/course/contract";
import { PostForm } from "~/routes/admin_post_form/components/post-form";
import { INK_OUTLINE } from "~/routes/admin_post_form/surfaces";

// The page shared by two routes, each a thin file beside this one: `/admin/blog/new` (`admin-post-new.tsx`) and
// `/admin/blog/$id/edit` (`admin-post-edit.tsx`). The edit route passes the post; the new one passes `null`. The admin
// layout guards both.

/*===== Queries =====*/
/** The catalogue, for the closing course's choices. Both routes read it. */
export const coursesQuery = () => orpc.course.admin.list.queryOptions();

/** The post being edited. The API answers NOT_FOUND for an unknown id, which the edit route turns into a 404. */
export const postQuery = (id: string) => orpc.blog.admin.get.queryOptions({ input: { id } });

/*===== Head =====*/
/** The tab's title: the post being edited, or «نوشته‌ی تازه» (also while there is no post to name). */
export function postFormTitle(postTitle: string | undefined) {
  return `${postTitle ? `ویرایش ${postTitle}` : "نوشته‌ی تازه"} | مدیریت زروان`;
}

/*===== Admin Post Form =====*/
/** F16's form for writing a post and fixing one; keyed by post, so going from one post's edit to another's starts fresh. */
export function AdminPostForm({ post, courses }: { post: AdminBlogPost | null; courses: AdminCourse[] }) {
  return <PostForm key={post?.id ?? "new"} post={post} courses={courses} />;
}

/*===== Error Boundary =====*/
// Inside the Admin shell, so the rail and tabs stay on screen.
export function PostFormError({ notFound }: { notFound: boolean }) {
  return (
    <div>
      <AdminPageHeader
        title={notFound ? "این نوشته پیدا نشد" : "فرم نوشته باز نشد"}
        summary={
          notFound
            ? "شاید پاک شده یا نشانیش اشتباهه. از فهرست وبلاگ دوباره بازش کن."
            : "یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."
        }
      />
      <Link to="/admin/blog" className={buttonVariants({ variant: "outline", className: INK_OUTLINE })}>
        برگرد به وبلاگ
      </Link>
    </div>
  );
}
