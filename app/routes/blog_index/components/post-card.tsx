import { blogCategoryLabel } from "~/components/blog/category-label";
import { Link } from "~/components/link";
import type { BlogCard } from "~/orpc/blog/contract";
import { PostMeta } from "~/routes/blog_index/components/post-meta";

/*===== Post Card =====*/
/**
 * One post in the list. From tablets it is a card: the cover on top (the `card` size), the section, the title, the
 * summary and the meta. On phones it is a row, the way a reading app lists articles: a small cover at the start and the
 * words beside it, so several posts fit a screen. The whole card is the link (the title's link is stretched over it).
 */
export function PostCard({ post }: { post: BlogCard }) {
  return (
    <article className="group/card relative flex h-full gap-4 rounded-3xl border border-foreground/15 bg-card p-3 shadow-sm transition-transform duration-150 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50 motion-safe:active:scale-[0.98] md:flex-col md:gap-0 md:overflow-hidden md:p-0">
      {/*------ Cover ------*/}
      <div className="w-28 shrink-0 self-start overflow-hidden rounded-2xl bg-sunken sm:w-36 md:w-full md:rounded-none">
        <img
          src={post.cover.urls.card}
          srcSet={`${post.cover.urls.thumb} 480w, ${post.cover.urls.card} 960w`}
          sizes="(min-width: 64rem) 22rem, (min-width: 48rem) 45vw, 9rem"
          alt={post.cover.alt}
          width={960}
          height={540}
          loading="lazy"
          decoding="async"
          style={{ backgroundImage: `url("${post.cover.placeholder}")`, backgroundSize: "cover" }}
          className="aspect-[4/3] h-auto w-full object-cover transition-transform duration-700 motion-safe:group-hover/card:scale-[1.04] md:aspect-video"
        />
      </div>

      {/*------ Words ------*/}
      <div className="flex min-w-0 flex-1 flex-col md:p-5">
        <p className="text-xs font-bold text-primary sm:text-sm">{blogCategoryLabel(post.category)}</p>
        <h2
          dir="auto"
          className="mt-1 line-clamp-3 leading-7 font-extrabold text-pretty md:mt-2 md:text-lg md:leading-8"
        >
          <Link
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {post.title}
          </Link>
        </h2>
        <p dir="auto" className="mt-2 line-clamp-3 text-sm leading-7 text-pretty text-muted-foreground max-md:hidden">
          {post.excerpt}
        </p>
        <div className="mt-auto pt-3 md:pt-5">
          <PostMeta post={post} />
        </div>
      </div>
    </article>
  );
}
