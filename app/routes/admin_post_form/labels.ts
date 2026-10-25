import type { BlogCategory } from "~/orpc/blog/constants";

/*===== Labels =====*/
// The Admin is Persian only, so the blog's section names are written here (the public pages read theirs from
// `messages/blog/`). The same words, so a post's section reads the same on both sides. Copied from the list's
// (`admin_posts/labels.ts`), since slices don't share.

export const CATEGORY_LABELS: Record<BlogCategory, string> = {
  behavior: "رفتار",
  training: "آموزش",
  care: "نگهداری و سلامت",
  puppy: "توله‌ها",
};
