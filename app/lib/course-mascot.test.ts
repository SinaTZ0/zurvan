import { describe, expect, it } from "vitest";

import { courseMascotPose } from "~/lib/course-mascot";

describe("courseMascotPose", () => {
  it("gives a seeded course its own pose", () => {
    expect(courseMascotPose({ slug: "advanced", family: "obedience" })).toBe("course-recall");
  });

  it("gives a course the Admin added later its family's pose, or the default", () => {
    expect(courseMascotPose({ slug: "agility-2", family: "sport" })).toBe("course-sport");
    expect(courseMascotPose({ slug: "something-new", family: "behavior" })).toBe("course-manners");
  });
});
