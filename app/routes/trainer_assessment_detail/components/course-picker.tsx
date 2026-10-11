import { useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "~/components/ui/combobox";
import type { PathCourse } from "~/routes/trainer_assessment_detail/components/recommendation-path";

/*===== Course Picker =====*/
/**
 * Adds a course to the path: a combobox over the approved courses that aren't in it yet. It searches the Persian title
 * and the Latin name («CGC»). Picking adds the course at the end and clears the box for the next one.
 */
export function CoursePicker({
  courses,
  disabled,
  onAdd,
}: {
  /** Not already on the path. */
  courses: readonly PathCourse[];
  disabled?: boolean;
  onAdd: (course: PathCourse) => void;
}) {
  const [query, setQuery] = useState("");

  return (
    <Combobox
      items={courses}
      // The Latin name is part of the searched text, so «bmc» finds «مدرک رفتار پایه» too.
      itemToStringLabel={(course: PathCourse) => `${course.title} ${course.latinName}`}
      itemToStringValue={(course: PathCourse) => course.slug}
      value={null}
      inputValue={query}
      onInputValueChange={setQuery}
      onValueChange={(course: PathCourse | null) => {
        if (!course) return;
        onAdd(course);
        setQuery("");
      }}
      disabled={disabled}
    >
      <ComboboxInput
        aria-label="دوره‌ی دیگری به مسیر اضافه کن"
        placeholder="دوره‌ی دیگری اضافه کن"
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>دوره‌ای پیدا نشد.</ComboboxEmpty>
        <ComboboxList>
          {(course: PathCourse) => (
            <ComboboxItem key={course.slug} value={course}>
              <span className="min-w-0 flex-1 truncate">{course.title}</span>
              <span dir="ltr" className="text-xs text-muted-foreground">
                {course.latinName}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
