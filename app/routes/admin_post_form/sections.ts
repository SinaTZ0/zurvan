import type { PostFormInput } from "~/routes/admin_post_form/schema";

/*===== Form Plates =====*/
// The four plates of the form, in page order. Each has an anchor (the contents list beside the form jumps to it) and
// the fields it holds, so the list can mark the plate that has a message without asking each plate.

export type PostFormSectionId = "text" | "cover" | "details" | "english";

export const POST_FORM_SECTIONS: readonly {
  id: PostFormSectionId;
  title: string;
  fields: readonly (keyof PostFormInput)[];
}[] = [
  { id: "text", title: "متن", fields: ["title", "excerpt", "body"] },
  { id: "cover", title: "عکس", fields: ["coverMediaId", "coverAlt"] },
  { id: "details", title: "جزئیات", fields: ["slug", "category", "relatedCourseSlug"] },
  { id: "english", title: "انگلیسی", fields: ["titleEn", "excerptEn", "coverAltEn", "bodyEn"] },
];

/** The plate's anchor in the page (`#post-plate-text`). */
export function sectionAnchor(id: PostFormSectionId): string {
  return `post-plate-${id}`;
}

/** The title of one plate, so a plate and its contents entry never say two different things. */
export function sectionTitle(id: PostFormSectionId): string {
  return POST_FORM_SECTIONS.find((section) => section.id === id)?.title ?? "";
}
