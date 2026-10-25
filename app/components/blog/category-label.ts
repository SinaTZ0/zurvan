import type { BlogCategory } from "~/orpc/blog/constants";
import { m } from "~/paraglide/messages";

/*===== Category Label =====*/
// The words of a section, from `messages/blog/`. Getters, not strings, so a label is read in the page's language when
// it is asked for (never frozen at import).
const LABELS: Record<BlogCategory, () => string> = {
  behavior: m.blog_category_behavior,
  training: m.blog_category_training,
  care: m.blog_category_care,
  puppy: m.blog_category_puppy,
};

/** A post section's name in the page's language: «رفتار», «Puppies». */
export function blogCategoryLabel(category: BlogCategory): string {
  return LABELS[category]();
}
