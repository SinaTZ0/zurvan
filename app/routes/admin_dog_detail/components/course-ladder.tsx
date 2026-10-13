import { useState } from "react";

import { useAdminAction } from "~/hooks/use-admin-action";
import { client } from "~/orpc/client";
import type { AdminDog } from "~/orpc/dog/contract";
import { DetailSection } from "~/routes/admin_dog_detail/components/detail-section";
import { LadderRung } from "~/routes/admin_dog_detail/components/ladder-rung";
import type { Rung } from "~/routes/admin_dog_detail/ladder";

/*===== Course Ladder =====*/
/**
 * The dog's courses as the road it walks (F2, F4): a rung per approved course in catalogue order, so the reasons on a
 * locked rung («اول باید دوره‌ی … را تمام کند») point at the rung before it. The Admin marks a course passed for a dog he
 * already knows, or takes his own mark off again; a pass from an enrollment is final and has no button.
 *
 * The buttons share one pending state: while one rung saves, all of them wait.
 */
export function CourseLadder({ dog, rungs }: { dog: Pick<AdminDog, "id" | "name">; rungs: Rung[] }) {
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  /*------ Mark ------*/
  const mark = useAdminAction({
    mutationFn: (vars: { dogId: string; courseSlug: string; passed: boolean; title: string }) =>
      client.dog.admin.setPassedCourse({ dogId: vars.dogId, courseSlug: vars.courseSlug, passed: vars.passed }),
    success: (_saved, vars) =>
      vars.passed ? `${vars.title} برای ${dog.name} گذرانده شد.` : `علامت ${vars.title} برای ${dog.name} برداشته شد.`,
  });

  function onMark({ rung, passed }: { rung: Rung; passed: boolean }) {
    setSavingSlug(rung.slug);
    mark.run({ dogId: dog.id, courseSlug: rung.slug, passed, title: rung.title });
  }

  return (
    <DetailSection id="ladder" title="دوره‌ها">
      {rungs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          دوره‌ای منتشر نشده
        </p>
      ) : (
        <ol className="divide-y divide-border rounded-2xl border border-border bg-card p-4">
          {rungs.map((rung) => (
            <LadderRung
              key={rung.slug}
              rung={rung}
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
