import type { BlogBody } from "~/lib/blog-body";
import type { BlogPost } from "~/orpc/blog/contract";

/*===== Sample Post =====*/
// A clearly fake post for the article's stories: every block the body format has (H2 and H3, bold and italic, an
// internal, an external and an unsafe link, a line break, a quote, a tip, bullet and numbered lists with a nested one,
// a figure with a caption, an English paragraph) and an unknown block that must be skipped. The pictures are the
// course stand-ins in `public/photo/home/`; nothing here is the owner's text.

const COVER = "/photo/home/course-elementary.webp";

const text = (value: string, format = 0) => ({ type: "text" as const, text: value, format });

const SAMPLE_BODY: BlogBody = {
  root: {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          text("این یک نوشته‌ی نمونه است، فقط برای دیدن شکل صفحه. "),
          text("متن پررنگ", 1),
          text("، "),
          text("متن کج", 2),
          text(" و "),
          text("هر دو با هم", 3),
          text(" در یک خط."),
        ],
      },
      { type: "heading", tag: "h2", children: [text("بخش اول نمونه")] },
      {
        type: "paragraph",
        children: [
          text("یک پیوند داخلی به "),
          { type: "link", url: "/courses", children: [text("دوره‌ها")] },
          text("، یک پیوند بیرونی به "),
          { type: "link", url: "https://example.com", children: [text("یک سایت نمونه")] },
          text(" و یک پیوند ناامن که فقط متنش می‌ماند: "),
          { type: "link", url: "javascript:alert(1)", children: [text("این پیوند نیست")] },
          text("."),
          { type: "linebreak" },
          text("این خط بعد از یک شکست خط آمده."),
        ],
      },
      { type: "heading", tag: "h3", children: [text("یک زیربخش نمونه")] },
      {
        type: "list",
        listType: "bullet",
        children: [
          { type: "listitem", children: [text("مورد اول فهرست نقطه‌دار")] },
          { type: "listitem", children: [text("مورد دوم، که یک فهرست تودرتو دارد:")] },
          {
            type: "listitem",
            children: [
              {
                type: "list",
                listType: "bullet",
                children: [
                  { type: "listitem", children: [text("زیرمورد یک")] },
                  { type: "listitem", children: [text("زیرمورد دو")] },
                ],
              },
            ],
          },
          { type: "listitem", children: [text("مورد سوم")] },
        ],
      },
      {
        type: "tip",
        children: [text("این نکته‌ی نمونه‌ست که سگ می‌گه؛ "), text("یه کلمه‌ش پررنگه", 1), text("!")],
      },
      {
        type: "figure",
        mediaId: "sample",
        alt: "عکس نمونه از یک سگ روی چمن",
        caption: "زیرنویس نمونه برای عکس.",
        width: 744,
        height: 496,
        src: "/photo/home/course-bmc.webp",
        fullSrc: "/photo/home/course-bmc.webp",
      },
      { type: "heading", tag: "h2", children: [text("بخش دوم نمونه")] },
      {
        type: "list",
        listType: "number",
        children: [
          { type: "listitem", children: [text("قدم اول نمونه")] },
          { type: "listitem", children: [text("قدم دوم نمونه")] },
          { type: "listitem", children: [text("قدم سوم نمونه")] },
        ],
      },
      { type: "quote", children: [text("یک نقل‌قول نمونه، برای دیدن شکلش در متن.")] },
      {
        type: "paragraph",
        children: [text("An English paragraph inside a Persian post runs left to right on its own.")],
      },
      // An unknown block (from a future editor) is skipped, never drawn and never a crash.
      { type: "table", children: [] } as unknown as BlogBody["root"]["children"][number],
      { type: "heading", tag: "h2", children: [text("بخش سوم نمونه")] },
      { type: "paragraph", children: [text("پاراگراف آخر نمونه.")] },
    ],
  },
};

/** The full sample: every block, three sections, a related course. */
export const SAMPLE_POST: BlogPost = {
  slug: "sample-post",
  title: "نوشته‌ی نمونه: این متن واقعی نیست",
  excerpt: "خلاصه‌ی نمونه برای دیدن شکل صفحه‌ی نوشته. هیچ‌کدام از این جمله‌ها نوشته‌ی مربی نیست.",
  category: "training",
  cover: {
    alt: "عکس نمونه‌ی جلد",
    placeholder: COVER,
    urls: { thumb: COVER, card: COVER, hero: COVER, og: COVER },
  },
  publishedAt: new Date("2026-10-20T08:00:00Z"),
  updatedAt: new Date("2026-10-21T08:00:00Z"),
  readingMinutes: 3,
  body: SAMPLE_BODY,
  hasEnglish: false,
  relatedCourse: {
    slug: "elementary",
    title: "دوره‌ی نمونه",
    summary: "خلاصه‌ی نمونه‌ی دوره‌ای که به این نوشته ربط دارد.",
    cover: { src: COVER, alt: "عکس نمونه‌ی دوره", width: 744, height: 496 },
  },
};

/** A short post: no H2s (so no contents list), no related course (so the evaluation ask). */
export const SAMPLE_SHORT_POST: BlogPost = {
  ...SAMPLE_POST,
  slug: "sample-short-post",
  title: "نوشته‌ی کوتاه نمونه",
  category: "behavior",
  relatedCourse: null,
  readingMinutes: 1,
  body: {
    root: {
      type: "root",
      children: [
        { type: "paragraph", children: [text("یک نوشته‌ی کوتاه نمونه، بدون بخش‌بندی و بدون دوره‌ی مرتبط.")] },
        { type: "tip", children: [text("نکته‌ی کوتاه نمونه.")] },
      ],
    },
  },
};
