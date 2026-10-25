import { cn } from "cn";
import { CalendarDaysIcon, ChevronLeftIcon, ClockIcon } from "lucide-react";

import { blogCategoryLabel } from "~/components/blog/category-label";
import { categoryScene } from "~/components/blog/category-scene";
import { BLOG_COLUMN } from "~/components/blog/column";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { formatNumber, formatTimestamp } from "~/lib/locale-format";
import type { BlogPost } from "~/orpc/blog/contract";
import { m } from "~/paraglide/messages";

/*===== Article Header =====*/
/**
 * The post's top: the way back to the blog and its section, the title (the page's only h1), the summary, and who wrote
 * it and when, beside the section's stage, where the mascot greets the reader in front of the section's place
 * (`categoryScene`).
 *
 * Wide: the words at the start (7 columns), the stage at the end, standing on a path. Phones: the stage on top as a
 * short band, then the words.
 *
 * The page's load moment (`ba-*`, in `PostArticle`): the dog rises from behind the path, then his bubble pops.
 */
export function ArticleHeader({ post }: { post: BlogPost }) {
  const category = blogCategoryLabel(post.category);

  return (
    <header className={cn(BLOG_COLUMN, "grid gap-y-6 pt-4 lg:grid-cols-12 lg:items-end lg:gap-x-12 lg:pt-section-sm")}>
      {/*===== Words =====*/}
      <div className="order-2 lg:order-1 lg:col-span-7 lg:pb-10">
        {/*------ Breadcrumb ------*/}
        <nav aria-label={m.blog_article_breadcrumb_label()}>
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link
                to="/blog"
                className="rounded-sm transition-colors outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {m.blog_article_breadcrumb_blog()}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronLeftIcon strokeWidth={1.7} className="size-4 ltr:-scale-x-100" />
            </li>
            <li>
              <Link
                to="/blog"
                search={{ category: post.category }}
                className="rounded-full border border-primary/50 px-3 py-0.5 font-bold text-primary transition-colors outline-none hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {category}
              </Link>
            </li>
          </ol>
        </nav>

        {/*------ Title and Summary ------*/}
        <h1 id="post-title" dir="auto" className={cn(DISPLAY_HEADING, "mt-5 text-h1 leading-[1.35] text-balance")}>
          {post.title}
        </h1>
        <p dir="auto" className="mt-4 max-w-2xl text-lead text-pretty text-foreground/80">
          {post.excerpt}
        </p>

        {/*------ Byline ------*/}
        {/* The site sells a named person: the post is hers, so her face comes before the date. */}
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-foreground/15 pt-5">
          <p className="flex items-center gap-3">
            <img
              src={HEAD_TRAINER.photos.avatar.src}
              alt=""
              width={HEAD_TRAINER.photos.avatar.width}
              height={HEAD_TRAINER.photos.avatar.height}
              className="size-11 shrink-0 rounded-full object-cover ring-2 ring-primary/70"
            />
            <span className="font-bold">{m.blog_article_by({ name: HEAD_TRAINER.name })}</span>
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDaysIcon aria-hidden strokeWidth={1.7} className="size-4 text-primary" />
            <span className="sr-only">{m.blog_article_published_label()}</span>
            <time dateTime={post.publishedAt.toISOString()}>{formatTimestamp(post.publishedAt)}</time>
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClockIcon aria-hidden strokeWidth={1.7} className="size-4 text-primary" />
            {m.blog_reading_minutes({ count: formatNumber(post.readingMinutes) })}
          </p>
        </div>
      </div>

      {/*===== Stage =====*/}
      <ArticleStage post={post} />
    </header>
  );
}

/*===== Stage =====*/
/**
 * The section's place under a chalk night sky, on a strip of path with a bush at each end and a pool of warm light where
 * the dog stands. Laid out in logical sides and mirrored on the English pages, so he always stands nearest the words
 * and looks at them (see `categoryScene`). Decoration, apart from his line, which is his greeting to the reader.
 */
function ArticleStage({ post }: { post: BlogPost }) {
  const scene = categoryScene(post.category);

  return (
    <div className="relative order-1 h-[12.5rem] lg:order-2 lg:col-span-5 lg:h-[21rem]">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_40%_78%,rgb(255_194_26/0.08),transparent)] ltr:bg-[radial-gradient(ellipse_50%_60%_at_60%_78%,rgb(255_194_26/0.08),transparent)]"
      />

      {/*------ Sky ------*/}
      <NightSky className="end-[2%] top-0 h-16 w-[30%] lg:top-4 lg:h-24 lg:w-[32%]" />

      {/*------ Place, Bushes and Path ------*/}
      <div aria-hidden>
        <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />
        <MascotCut
          name={scene.scenery}
          eager
          className={cn(
            "absolute bottom-[0.9rem] translate-y-[6%] scenery-dim lg:bottom-[1.2rem] ltr:-scale-x-100",
            scene.sceneryClass,
          )}
        />
        <MascotCut
          name="plants"
          eager
          className="lively-sway absolute start-[-4%] bottom-[0.9rem] w-[14%] translate-y-[6%] lg:bottom-[1.2rem] lg:w-[13%]"
        />
        <MascotCut
          name="plants"
          eager
          className="lively-sway-2 absolute end-[-3%] bottom-[0.9rem] w-[12%] translate-y-[6%] -scale-x-100 lg:bottom-[1.2rem]"
        />
      </div>

      {/*------ Dog ------*/}
      <div aria-hidden className={cn("ba-dog absolute bottom-[0.9rem] lg:bottom-[1.2rem]", scene.dogClass)}>
        <MascotCut
          name={scene.dog}
          eager
          className="lively-breathe block h-full w-auto translate-y-[3%] ltr:-scale-x-100"
        />
      </div>

      {/*------ Bubble ------*/}
      <p
        className={cn(
          "ba-pop absolute w-max max-w-[min(17rem,80%)] rounded-[1.4rem] border-2 border-foreground bg-background px-4 py-2.5 font-hand text-[15px] leading-snug text-pretty text-foreground md:text-lg",
          scene.bubbleClass,
        )}
      >
        {scene.line()}
        <span
          aria-hidden
          className="absolute start-9 -bottom-[9px] size-4 rotate-45 border-r-2 border-b-2 border-foreground bg-background"
        />
      </p>
    </div>
  );
}
