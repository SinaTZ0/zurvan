import { cn } from "cn";

import { BodyLink } from "~/components/blog/body-link";
import { PostFigure } from "~/components/blog/post-figure";
import { stopPreviewLinks } from "~/components/blog/preview-clicks";
import { PostTip } from "~/components/blog/post-tip";
import {
  type BlogBlock,
  type BlogBody,
  type BlogInline,
  type BlogList,
  type BlogListItem,
  headingId,
  TEXT_BOLD,
  TEXT_ITALIC,
} from "~/lib/blog-body";

/*===== Post Body =====*/
// Draws a post's stored body (`app/lib/blog-body.ts`) as the article's text, block by block, with no HTML from the
// database anywhere: every node becomes an element here. The Admin's preview hands it the editor's own JSON, which can
// carry nodes and fields the stored form never does, so every read is defensive: a block it doesn't know is skipped,
// an inline it doesn't know keeps its words, and nothing throws.
//
// Lexical stores no direction, so every block gets `dir="auto"`: a paragraph that starts in English runs left to right
// inside a Persian post (and the other way round).

/*===== Text Styles =====*/
// The reading column is calm: Vazirmatn at 17–18px with generous Persian leading (a little tighter for a block that
// reads left to right), muted ivory so the gold of the links and the bold words carry the eye.
const PARAGRAPH =
  "mt-6 text-[1.0625rem] leading-[2.05] text-pretty text-foreground/85 first:mt-0 md:text-lg md:leading-[2.1] [&:dir(ltr)]:leading-[1.8]";

/*===== Inlines =====*/
function TextRun({ text, format }: { text: string; format: number }) {
  let node: React.ReactNode = text;
  if (format & TEXT_ITALIC) node = <em className="italic">{node}</em>;
  if (format & TEXT_BOLD) node = <strong className="font-extrabold text-foreground">{node}</strong>;
  return <>{node}</>;
}

/** A line's runs, links and line breaks. An unknown inline keeps its words (its text or its children's). */
function Inlines({ nodes }: { nodes: readonly BlogInline[] | undefined }) {
  return (
    <>
      {(nodes ?? []).map((node, index) => {
        switch (node?.type) {
          case "text":
            return <TextRun key={index} text={node.text ?? ""} format={node.format ?? 0} />;
          case "linebreak":
            return <br key={index} />;
          case "link":
            return (
              <BodyLink key={index} url={node.url ?? ""}>
                <Inlines nodes={node.children} />
              </BodyLink>
            );
          default: {
            const loose = node as unknown as { text?: unknown; children?: unknown };
            if (typeof loose.text === "string") return <TextRun key={index} text={loose.text} format={0} />;
            if (Array.isArray(loose.children)) return <Inlines key={index} nodes={loose.children as BlogInline[]} />;
            return null;
          }
        }
      })}
    </>
  );
}

/*===== Lists =====*/
/**
 * A bullet or numbered list. Lexical nests a list as an item of its own that holds only the inner list (the line is
 * the item before it), so such an item draws no marker of its own. Numbered lists count in the block's own digits: a
 * Persian list in Persian numerals, an English one in Latin ones.
 */
function ListBlock({ list, nested = false }: { list: BlogList; nested?: boolean }) {
  const Tag = list.listType === "number" ? "ol" : "ul";
  return (
    <Tag
      dir="auto"
      className={cn(
        "flex flex-col gap-2.5 ps-6 text-[1.0625rem] leading-[2] text-foreground/85 marker:font-bold marker:text-primary md:text-lg",
        list.listType === "number" ? "list-decimal [&:dir(rtl)]:[list-style-type:persian]" : "list-disc",
        nested ? "mt-2.5" : "mt-6 first:mt-0",
      )}
    >
      {(list.children ?? []).map((item, index) => (
        <ListItem key={index} item={item} />
      ))}
    </Tag>
  );
}

function ListItem({ item }: { item: BlogListItem }) {
  const children = item?.children ?? [];
  const lists = children.filter((child): child is BlogList => child?.type === "list");
  const line = children.filter((child): child is BlogInline => child?.type !== "list");

  return (
    <li className={cn("ps-1 text-pretty", line.length === 0 && "list-none")}>
      <Inlines nodes={line} />
      {lists.map((list, index) => (
        <ListBlock key={index} list={list} nested />
      ))}
    </li>
  );
}

/*===== Blocks =====*/
function Block({ block, h2Index }: { block: BlogBlock; h2Index: number }) {
  switch (block?.type) {
    case "paragraph":
      return (
        <p dir="auto" className={PARAGRAPH}>
          <Inlines nodes={block.children} />
        </p>
      );

    case "heading":
      return block.tag === "h2" ? (
        // The contents list links to it, so it clears the screen's top edge when it is scrolled to.
        <h2
          id={headingId(h2Index)}
          dir="auto"
          className="mt-14 scroll-mt-8 font-display text-[1.45rem] leading-[1.5] font-extrabold tracking-tight text-balance text-foreground first:mt-0 md:text-[1.7rem]"
        >
          <Inlines nodes={block.children} />
        </h2>
      ) : (
        <h3
          dir="auto"
          className="mt-10 text-lg leading-[1.7] font-extrabold text-balance text-foreground first:mt-0 md:text-xl"
        >
          <Inlines nodes={block.children} />
        </h3>
      );

    case "quote":
      return (
        <blockquote
          dir="auto"
          className="mt-8 border-s-[3px] border-primary ps-5 text-lg leading-[1.95] font-bold text-pretty text-foreground first:mt-0 md:ps-7 md:text-xl md:leading-[2]"
        >
          <Inlines nodes={block.children} />
        </blockquote>
      );

    case "tip":
      return (
        <PostTip>
          <Inlines nodes={block.children} />
        </PostTip>
      );

    case "list":
      return <ListBlock list={block} />;

    case "figure":
      return <PostFigure figure={block} />;

    default:
      return null;
  }
}

/**
 * The article's text. `preview` is the Admin's preview of unsaved text: it is drawn the same way, but its links don't
 * navigate away from the form (`PostArticle` already guards the whole article; this covers the body drawn on its own).
 *
 * H2 ids count every H2, empty ones too, exactly as `bodyHeadings` does, so the contents list and the headings agree.
 */
export function PostBody({
  body,
  preview = false,
  className,
}: {
  body: BlogBody;
  preview?: boolean;
  className?: string;
}) {
  const blocks = Array.isArray(body?.root?.children) ? body.root.children : [];

  /*------ H2 Numbers ------*/
  let h2Count = 0;
  const numbered = blocks.map((block) => {
    const h2Index = block?.type === "heading" && block.tag === "h2" ? h2Count++ : -1;
    return { block, h2Index };
  });

  return (
    <div className={cn("max-w-[65ch]", className)} onClickCapture={preview ? stopPreviewLinks : undefined}>
      {numbered.map(({ block, h2Index }, index) => (
        <Block key={index} block={block} h2Index={h2Index} />
      ))}
    </div>
  );
}
