/*===== Form Sections =====*/
// The form's three parts, named once so the form can say which one the owner is in and the dog's bubble can answer it.

export const DOG_FORM_SECTIONS = ["identity", "body", "trainer"] as const;

export type DogFormSection = (typeof DOG_FORM_SECTIONS)[number];
