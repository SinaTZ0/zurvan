import type { CourseFormInput } from "~/routes/admin_course_form/schema";

/*===== Form Plates =====*/
// The seven plates of the form, in page order. Each has an anchor (the contents list beside the card jumps to it) and
// the fields it holds, so the list can mark the plate that has a message without asking each plate.

export type CourseFormSectionId = "intro" | "cover" | "ages" | "price" | "prerequisites" | "text" | "english";

export const COURSE_FORM_SECTIONS: readonly {
  id: CourseFormSectionId;
  title: string;
  fields: readonly (keyof CourseFormInput)[];
}[] = [
  { id: "intro", title: "معرفی دوره", fields: ["title", "latinName", "slug", "family", "summary"] },
  { id: "cover", title: "عکس دوره", fields: ["coverMediaId", "coverAlt"] },
  { id: "ages", title: "سن و جلسه‌ها", fields: ["minAgeMonths", "maxAgeMonths", "sessionCount", "place"] },
  { id: "price", title: "قیمت", fields: ["price", "boardingPrice"] },
  { id: "prerequisites", title: "پیش‌نیازها", fields: ["prerequisites"] },
  { id: "text", title: "متن صفحه‌ی دوره", fields: ["highlights", "commands"] },
  {
    id: "english",
    title: "متن انگلیسی",
    fields: ["titleEn", "summaryEn", "coverAltEn", "highlightsEn", "commandsEn"],
  },
];

/** The plate's anchor in the page (`#course-plate-intro`). */
export function sectionAnchor(id: CourseFormSectionId): string {
  return `course-plate-${id}`;
}

/** The title of one plate, so a plate and its contents entry never say two different things. */
export function sectionTitle(id: CourseFormSectionId): string {
  return COURSE_FORM_SECTIONS.find((section) => section.id === id)?.title ?? "";
}
