import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminPostForm, PostFormError, coursesQuery, postFormTitle } from "~/routes/admin_post_form/admin-post-form";

/*===== Route =====*/
// A new post: the form starts empty. The catalogue is read for the closing course's choices.
export const Route = createFileRoute("/admin/blog/new")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(coursesQuery()),
  head: () => ({ meta: [{ title: postFormTitle(undefined) }] }),
  component: NewPostPage,
  notFoundComponent: () => <PostFormError notFound />,
  errorComponent: () => <PostFormError notFound={false} />,
});

/*===== Page =====*/
function NewPostPage() {
  const { data: courses } = useSuspenseQuery(coursesQuery());
  return <AdminPostForm post={null} courses={courses} />;
}
