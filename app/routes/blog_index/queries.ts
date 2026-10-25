import type { BlogCategory } from "~/orpc/blog/constants";
import { orpc } from "~/orpc/client";

/*===== Queries =====*/
/** The published posts for a section and a search, newest first: the loader ensures it, the page reads it. */
export const postsQuery = ({ category, q }: { category: BlogCategory | undefined; q: string | undefined }) =>
  orpc.blog.list.queryOptions({ input: { category, q } });
