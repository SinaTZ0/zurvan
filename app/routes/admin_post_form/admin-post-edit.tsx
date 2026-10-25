import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { orNotFound } from "~/lib/not-found";
import {
  AdminPostForm,
  PostFormError,
  coursesQuery,
  postFormTitle,
  postQuery,
} from "~/routes/admin_post_form/admin-post-form";

/*===== Route =====*/
// One post's edit: the API answers NOT_FOUND for an unknown or malformed id, which becomes a 404. The catalogue is
// read for the closing course's choices.
export const Route = createFileRoute("/admin/blog/$id/edit")({
  loader: async ({ context: { queryClient }, params }) => {
    const [post] = await orNotFound(
      Promise.all([queryClient.ensureQueryData(postQuery(params.id)), queryClient.ensureQueryData(coursesQuery())]),
    );
    return { title: post.title };
  },
  head: ({ loaderData }) => ({ meta: [{ title: postFormTitle(loaderData?.title) }] }),
  component: EditPostPage,
  notFoundComponent: () => <PostFormError notFound />,
  errorComponent: () => <PostFormError notFound={false} />,
});

/*===== Page =====*/
function EditPostPage() {
  const { id } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQuery(id));
  const { data: courses } = useSuspenseQuery(coursesQuery());
  return <AdminPostForm post={post} courses={courses} />;
}
