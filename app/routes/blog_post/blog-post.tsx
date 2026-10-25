import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { PostArticle } from "~/components/blog/post-article";
import { localizedPath } from "~/lib/i18n";
import { orNotFound } from "~/lib/not-found";
import { pageHead } from "~/lib/seo";
import { orpc } from "~/orpc/client";
import { m } from "~/paraglide/messages";
import { PostMissing } from "~/routes/blog_post/components/post-missing";
import { blogPostingJsonLd, breadcrumbJsonLd, type PostHeadData } from "~/routes/blog_post/structured-data";

/*===== Query =====*/
const postQuery = (slug: string) => orpc.blog.get.queryOptions({ input: { slug } });

/*===== Route =====*/
// Public. A post's old address (its slug was changed after it was published) answers with a permanent redirect to the
// new one, in the same language. On the English site a post without English is a 404 (the API answers so), and a
// Persian-only post sends the language switch to the blog's list instead (`languageFallback`).
export const Route = createFileRoute("/_public/blog/$slug")({
  loader: async ({ context: { queryClient }, params }) => {
    const found = await orNotFound(queryClient.ensureQueryData(postQuery(params.slug)));
    if (found.kind === "moved") {
      // `href`, not `to`: TanStack writes it into the Location header as it is, so the language prefix is added here.
      throw redirect({ href: localizedPath({ path: `/blog/${encodeURIComponent(found.slug)}` }), statusCode: 301 });
    }

    const { post } = found;
    const head: PostHeadData = {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      coverOg: post.cover.urls.og,
      coverAlt: post.cover.alt,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    };
    return { head, hasEnglish: post.hasEnglish, languageFallback: post.hasEnglish ? undefined : "/blog" };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: m.blog_post_meta_not_found() }, { name: "robots", content: "noindex" }] };
    }
    const { head } = loaderData;
    return pageHead({
      path: `/blog/${head.slug}`,
      title: m.blog_post_meta_title({ title: head.title }),
      description: head.excerpt,
      locales: loaderData.hasEnglish ? ["fa", "en"] : ["fa"],
      image: { url: head.coverOg, width: 1200, height: 630, alt: head.coverAlt },
      article: { publishedAt: head.publishedAt, updatedAt: head.updatedAt },
      jsonLd: [blogPostingJsonLd(head), breadcrumbJsonLd(head)],
    });
  },
  component: BlogPostPage,
  notFoundComponent: () => <PostMissing missing />,
  errorComponent: () => <PostMissing missing={false} />,
});

/*===== Page =====*/
function BlogPostPage() {
  const { slug } = Route.useParams();
  const { data: found } = useSuspenseQuery(postQuery(slug));
  // The loader has already redirected a moved address.
  if (found.kind !== "post") return null;

  return <PostArticle post={found.post} />;
}
