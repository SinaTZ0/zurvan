import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";

/*===== Blog Body =====*/
// A post's text as stored and drawn (docs/app-spec.md, F16): the Lexical editor's JSON cut down to the nodes the article
// draws and the fields the renderer reads. Shared by the server (which stores only what `normalizeBody` returns), the
// article renderer and the Admin's editor. Nothing here imports Lexical: the stored shape is ours, so a Lexical upgrade
// can't break published posts.
//
// Lexical 0.52 doesn't store a direction; the editor and the renderer give every block `dir="auto"`, so a paragraph
// that starts in English runs left to right inside a Persian article.

/*===== Types =====*/
/** Lexical's text format bits the article draws. Every other bit (underline, colors, code…) is dropped. */
export const TEXT_BOLD = 1;
export const TEXT_ITALIC = 2;
const KEPT_FORMAT = TEXT_BOLD | TEXT_ITALIC;

export type BlogText = { type: "text"; text: string; format: number };
export type BlogLineBreak = { type: "linebreak" };
export type BlogLink = { type: "link"; url: string; children: (BlogText | BlogLineBreak)[] };
export type BlogInline = BlogText | BlogLineBreak | BlogLink;

/** A paragraph, a quote, or a tip (the mascot's chalk bubble). */
export type BlogTextBlock = { type: "paragraph" | "quote" | "tip"; children: BlogInline[] };
export type BlogHeading = { type: "heading"; tag: "h2" | "h3"; children: BlogInline[] };
export type BlogList = { type: "list"; listType: "bullet" | "number"; children: BlogListItem[] };
/** A list item holds its line, or (Lexical's shape for nesting) a list of its own. */
export type BlogListItem = { type: "listitem"; children: (BlogInline | BlogList)[] };

/**
 * An uploaded image. `mediaId`, `alt` and `caption` are the author's; the size and placeholder are written by the
 * server from the media row, and `src` / `fullSrc` are added when a post is read (the editor also keeps them, for its
 * own view and the preview). A client's values for those are never stored.
 */
export type BlogFigure = {
  type: "figure";
  mediaId: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
  placeholder?: string;
  src?: string;
  fullSrc?: string;
};

export type BlogBlock = BlogTextBlock | BlogHeading | BlogList | BlogFigure;
export type BlogBody = { root: { type: "root"; children: BlogBlock[] } };

/*===== Limits =====*/
export const BLOG_BODY_MAX_BLOCKS = 1500;
export const BLOG_BODY_MAX_FIGURES = 40;
export const BLOG_FIGURE_ALT_MAX_LENGTH = 200;
export const BLOG_FIGURE_CAPTION_MAX_LENGTH = 300;

/*===== Links =====*/
/** Addresses an article may link to: the web, mail, phone, and this site's own paths (`/courses`, not `//host`). */
const SAFE_URL = /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i;

export function isSafeHref(url: string): boolean {
  return SAFE_URL.test(url.trim());
}

/** Whether a link stays on this site, so the renderer uses the router's link and no `target`. */
export function isInternalHref(url: string): boolean {
  return /^\/(?!\/)/.test(url.trim());
}

/*===== Input Whitelist =====*/
// What the editor sends, read loosely (Lexical's housekeeping fields are ignored), but only these node types. Things
// the server can fix safely are fixed instead of refused: a pasted `h1` or `h4` becomes H2 or H3, a check list a bullet
// list, an unsafe link keeps its words and loses the link (the editor does the same before a save).

const textInput = z.object({ type: z.literal("text"), text: z.string(), format: z.number().int().optional() });
const linebreakInput = z.object({ type: z.literal("linebreak") });
const linkInput = z.object({
  type: z.literal("link"),
  url: z.string(),
  children: z.array(z.discriminatedUnion("type", [textInput, linebreakInput])),
});
const inlineInput = z.discriminatedUnion("type", [textInput, linebreakInput, linkInput]);

const textBlockInput = z.object({
  type: z.enum(["paragraph", "quote", "tip"]),
  children: z.array(inlineInput),
});
const headingInput = z.object({
  type: z.literal("heading"),
  tag: z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]),
  children: z.array(inlineInput),
});

type ListInput = { type: "list"; listType: "bullet" | "number" | "check"; children: ListItemInput[] };
type ListItemInput = { type: "listitem"; children: (z.infer<typeof inlineInput> | ListInput)[] };
const listItemInput: z.ZodType<ListItemInput> = z.lazy(() =>
  z.object({ type: z.literal("listitem"), children: z.array(z.union([inlineInput, listInput])) }),
);
const listInput: z.ZodType<ListInput> = z.lazy(() =>
  z.object({
    type: z.literal("list"),
    listType: z.enum(["bullet", "number", "check"]),
    children: z.array(listItemInput),
  }),
);

const figureInput = z.object({
  type: z.literal("figure"),
  mediaId: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
});

const blockInput = z.union([textBlockInput, headingInput, listInput, figureInput]);
const bodyInput = z.object({
  root: z.object({ type: z.literal("root"), children: z.array(blockInput).max(BLOG_BODY_MAX_BLOCKS) }),
});

/*===== Normalize =====*/
function cleanText(node: z.infer<typeof textInput>): BlogText {
  return { type: "text", text: node.text, format: (node.format ?? 0) & KEPT_FORMAT };
}

function cleanInline(node: z.infer<typeof inlineInput>): BlogInline[] {
  if (node.type === "text") return [cleanText(node)];
  if (node.type === "linebreak") return [{ type: "linebreak" }];

  const children = node.children.map((child) => (child.type === "text" ? cleanText(child) : child));
  return isSafeHref(node.url) ? [{ type: "link", url: node.url.trim(), children }] : children;
}

function cleanInlines(nodes: z.infer<typeof inlineInput>[]): BlogInline[] {
  return nodes.flatMap(cleanInline);
}

function cleanList(node: ListInput): BlogList {
  return {
    type: "list",
    listType: node.listType === "number" ? "number" : "bullet",
    children: node.children.map((item) => ({
      type: "listitem",
      children: item.children.flatMap((child): (BlogInline | BlogList)[] =>
        child.type === "list" ? [cleanList(child)] : cleanInline(child),
      ),
    })),
  };
}

function cleanBlock(node: z.infer<typeof blockInput>): BlogBlock {
  switch (node.type) {
    case "heading":
      return { type: "heading", tag: node.tag === "h1" || node.tag === "h2" ? "h2" : "h3", children: cleanInlines(node.children) };
    case "list":
      return cleanList(node);
    case "figure":
      return { type: "figure", mediaId: node.mediaId.trim(), alt: node.alt.trim(), caption: (node.caption ?? "").trim() };
    default:
      return { type: node.type, children: cleanInlines(node.children) };
  }
}

type NormalizeResult = { ok: true; body: BlogBody } | { ok: false; message: string };

/**
 * The stored form of what the editor sent: only the whitelisted nodes and fields, with what can be fixed fixed.
 * Figures come back with the author's fields only; the server adds their size and placeholder from the media rows.
 *
 * @returns `ok: false` with a Persian message for the Admin when the text holds something the editor can't make (a
 * table from another editor's paste), too many images, or an image without its words.
 */
export function normalizeBody(input: unknown): NormalizeResult {
  const parsed = bodyInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "متن چیزی داره که نوشته نمی‌تونه نشونش بده؛ آخرین چیزی که چسبوندی رو پاک کن و دوباره بنویس." };
  }

  const body: BlogBody = { root: { type: "root", children: parsed.data.root.children.map(cleanBlock) } };
  const figures = bodyFigures(body);
  if (figures.length > BLOG_BODY_MAX_FIGURES) {
    return { ok: false, message: `یه نوشته حداکثر ${formatNumberFa(BLOG_BODY_MAX_FIGURES)} عکس می‌تونه داشته باشه.` };
  }
  if (figures.some((figure) => figure.alt === "" || figure.alt.length > BLOG_FIGURE_ALT_MAX_LENGTH)) {
    return { ok: false, message: "برای هر عکس یه توضیح کوتاه بنویس (چی توی عکسه)." };
  }
  if (figures.some((figure) => figure.caption.length > BLOG_FIGURE_CAPTION_MAX_LENGTH)) {
    return { ok: false, message: `زیرنویس هر عکس حداکثر ${formatNumberFa(BLOG_FIGURE_CAPTION_MAX_LENGTH)} حرف می‌تونه باشه.` };
  }
  return { ok: true, body };
}

/** A body with nothing in it: what a new draft starts from. */
export function emptyBody(): BlogBody {
  return { root: { type: "root", children: [] } };
}

/*===== Reading =====*/
export function bodyFigures(body: BlogBody): BlogFigure[] {
  return body.root.children.filter((block): block is BlogFigure => block.type === "figure");
}

/** The words of a line, links included. */
export function inlineText(nodes: readonly BlogInline[]): string {
  return nodes
    .map((node) => (node.type === "text" ? node.text : node.type === "link" ? inlineText(node.children) : "\n"))
    .join("");
}

/** The body's words, one block per line: for search, the word count and a description when there is none. */
export function bodyText(body: BlogBody): string {
  const lines: string[] = [];

  const walkList = (list: BlogList) => {
    for (const item of list.children) {
      lines.push(inlineText(item.children.filter((child): child is BlogInline => child.type !== "list")));
      item.children.filter((child): child is BlogList => child.type === "list").forEach(walkList);
    }
  };

  for (const block of body.root.children) {
    if (block.type === "figure") lines.push(block.caption);
    else if (block.type === "list") walkList(block);
    else lines.push(inlineText(block.children));
  }
  return lines.filter((line) => line.trim() !== "").join("\n");
}

/** Words separated by spaces; a ZWNJ joins the parts of one Persian word («می‌خواهم»), so it doesn't split. */
export function countWords(text: string): number {
  return text.split(/\s+/u).filter(Boolean).length;
}

/** Minutes to read, at about 200 words a minute, never less than one. */
export function readingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200));
}

/*===== Headings =====*/
/**
 * The id of the `index`th H2 (0-based, counting every H2, empty ones too): the article's contents list links to it and
 * the renderer sets it, so both count the same way.
 */
export function headingId(index: number): string {
  return `section-${index + 1}`;
}

/** The H2s in order, for the article's contents list. H3s stay out: the list is a table of sections, not of every line. */
export function bodyHeadings(body: BlogBody): { id: string; text: string }[] {
  return body.root.children
    .filter((block): block is BlogHeading => block.type === "heading" && block.tag === "h2")
    .map((heading, index) => ({ id: headingId(index), text: inlineText(heading.children).trim() }))
    .filter((heading) => heading.text !== "");
}
