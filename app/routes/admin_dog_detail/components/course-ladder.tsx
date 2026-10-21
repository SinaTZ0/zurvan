import { cn } from "cn";
import { useState } from "react";

import { useAdminAction } from "~/hooks/use-admin-action";
import { ADMIN_PLATE } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import { client } from "~/orpc/client";
import type { AdminDog } from "~/orpc/dog/contract";
import { DetailSection } from "~/routes/admin_dog_detail/components/detail-section";
import { LadderRung } from "~/routes/admin_dog_detail/components/ladder-rung";
import type { Rung } from "~/routes/admin_dog_detail/ladder";
import { QUIET_LINE } from "~/routes/admin_dog_detail/surfaces";

/*===== Course Ladder =====*/
/**
 * The dog's courses drawn as one ladder (F2, F4): an ink rail down the start side of one plate, a rung per approved
 * course in catalogue order with its mark on the rail, so the reason on a locked rung («اول باید دوره‌ی … رو تمام کنه»)
 * points at a rung above it. The Admin marks a course passed for a dog he already knows, or takes his own mark off
 * again; a pass from an enrollment is final and has no button. The head counts the rungs climbed.
 *
 * The buttons share one pending state: while one rung saves, all of them wait.
 */
export function CourseLadder({ dog, rungs }: { dog: Pick<AdminDog, "id" | "name">; rungs: Rung[] }) {
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const passedCount = rungs.filter(
    (rung) => rung.state === "passed-admin" || rung.state === "passed-enrollment",
  ).length;

  /*------ Mark ------*/
  const mark = useAdminAction({
    mutationFn: (vars: { dogId: string; courseSlug: string; passed: boolean; title: string }) =>
      client.dog.admin.setPassedCourse({ dogId: vars.dogId, courseSlug: vars.courseSlug, passed: vars.passed }),
    success: (_saved, vars) =>
      vars.passed
        ? `${vars.title} برای ${dog.name} گذرونده ثبت شد.`
        : `علامت ${vars.title} برای ${dog.name} برداشته شد.`,
  });

  function onMark({ rung, passed }: { rung: Rung; passed: boolean }) {
    setSavingSlug(rung.slug);
    mark.run({ dogId: dog.id, courseSlug: rung.slug, passed, title: rung.title });
  }

  return (
    <DetailSection
      id="ladder"
      title="دوره‌ها"
      action={
        rungs.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {formatNumberFa(passedCount)} از {formatNumberFa(rungs.length)} گذرونده
          </p>
        )
      }
    >
      {rungs.length === 0 ? (
        <p className={QUIET_LINE}>هنوز دوره‌ای منتشر نشده.</p>
      ) : (
        <ol className={cn(ADMIN_PLATE, "px-3 py-1 sm:px-5")}>
          {rungs.map((rung, index) => (
            <LadderRung
              key={rung.slug}
              rung={rung}
              first={index === 0}
              last={index === rungs.length - 1}
              disabled={mark.isPending}
              saving={mark.isPending && savingSlug === rung.slug}
              onMark={onMark}
            />
          ))}
        </ol>
      )}
    </DetailSection>
  );
}
