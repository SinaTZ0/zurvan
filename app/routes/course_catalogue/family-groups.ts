import { FAMILY_TABS } from "~/lib/course-families";
import type { CourseFamily } from "~/orpc/course/constants";
import type { Course } from "~/orpc/course/contract";

/*===== Family Lines =====*/
// One plain line under each family's name: page copy, not the dog speaking. No counts, because the Admin can add
// courses and a number here would go stale. A family without a line (a new one nobody wrote for) gets just its name.
const FAMILY_LINES: Partial<Record<CourseFamily, string>> = {
  basics: "برای هر سنی؛ از قانون‌های خونه تا رفتار با بقیه.",
  "six-month": "فقط برای سگ‌هایی که شش ماهشون شده.",
  obedience: "دوره‌هاش پشت سر هم باز می‌شن: اول مقدماتی، بعد حرفه‌ای.",
  companion: "دوره‌هاش پشت سر هم باز می‌شن، هر کدوم بعد از قبلی.",
  working: "نگهبانی، حفاظت، ردیابی و کارهای دیگه؛ برنامه‌اش بعد از ارزیابی معلوم می‌شه.",
  sport: "برای مسابقه و ورزش‌های سگ؛ برنامه‌اش بعد از ارزیابی معلوم می‌شه.",
};

export type FamilyGroup = {
  family: CourseFamily;
  label: string;
  /** `null` when the family has no line. */
  line: string | null;
  courses: Course[];
};

/*===== Grouping =====*/
/**
 * Splits one page of courses by family, in the order a dog meets them (`FAMILY_TABS`). Families with no course on this
 * page are left out, so a family split across two pages simply repeats its header on each. The courses keep the order
 * they came in within a group.
 */
export function groupByFamily({ courses }: { courses: Course[] }): FamilyGroup[] {
  return FAMILY_TABS.flatMap(({ family, label }) => {
    const inFamily = courses.filter((course) => course.family === family);
    return inFamily.length === 0 ? [] : [{ family, label, line: FAMILY_LINES[family] ?? null, courses: inFamily }];
  });
}
