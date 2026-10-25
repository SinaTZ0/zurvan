import { ChevronLeftIcon } from "lucide-react";

import { blogCategoryLabel } from "~/components/blog/category-label";
import { Link } from "~/components/link";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import type { BlogCard } from "~/orpc/blog/contract";
import { m } from "~/paraglide/messages";
import { PostMeta } from "~/routes/blog_index/components/post-meta";

/*===== Lead Card =====*/
/**
 * The newest post of the list, large: its cover beside its words on wide screens (7/5), on top of them on phones. The
 * whole card is the link (the title's link is stretched over it). «تازه‌ترین» marks it only when there is an older post
 * to compare with. The cover is the `card` size, with the `thumb` for narrow screens.
 */
export function LeadCard({ post, newest }: { post: BlogCard; newest: boolean }) {
  return (
    <article className="group/card relative grid overflow-hidden rounded-4xl border border-foreground/15 bg-card paper-grain shadow-sm transition-transform duration-150 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50 motion-safe:active:scale-[0.99] lg:grid-cols-12">
      {/*------ Cover ------*/}
      <div className="relative overflow-hidden bg-sunken lg:col-span-7">
        <img
          src={post.cover.urls.card}
          srcSet={`${post.cover.urls.thumb} 480w, ${post.cover.urls.card} 960w`}
          sizes="(min-width: 64rem) 40rem, 100vw"
          alt={post.cover.alt}
          width={960}
          height={540}
          decoding="async"
          style={{ backgroundImage: `url("${post.cover.placeholder}")`, backgroundSize: "cover" }}
          className="aspect-video h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover/card:scale-[1.03]"
        />
        {newest && (
          <span className="absolute start-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-primary-foreground shadow-md">
            {m.blog_index_newest()}
          </span>
        )}
      </div>

      {/*------ Words ------*/}
      <div className="flex flex-col p-5 sm:p-7 lg:col-span-5 lg:p-9">
        <p className="text-sm font-bold text-primary">{blogCategoryLabel(post.category)}</p>
        <h2 dir="auto" className={`${DISPLAY_HEADING} mt-2 text-[1.5rem] leading-[1.45] text-balance md:text-[1.9rem]`}>
          <Link
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {post.title}
          </Link>
        </h2>
        <p dir="auto" className="mt-3 line-clamp-4 leading-8 text-pretty text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <PostMeta post={post} />
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform motion-safe:group-hover/card:-translate-x-1 ltr:motion-safe:group-hover/card:translate-x-1"
          >
            <ChevronLeftIcon className="size-5 ltr:-scale-x-100" strokeWidth={2.6} />
          </span>
        </div>
      </div>
    </article>
  );
}
