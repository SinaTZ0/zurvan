import { Lock } from "lucide-react";

import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Photo Note =====*/
/**
 * The one note on photos, which are not private and must say so plainly: a grained plate with its lock. On desktop it
 * stands under the contents plate (`privacy.tsx` places it), on phones it follows the list it belongs to.
 */
export function PhotoNote({ className }: { className?: string }) {
  return (
    <div className={`rounded-3xl border border-border bg-card paper-grain p-5 shadow-sm ${className ?? ""}`}>
      <div className="flex items-start gap-3">
        <Lock aria-hidden strokeWidth={1.5} className="mt-1 size-6 shrink-0 text-primary" />
        <div>
          <h3 className="font-extrabold">درباره‌ی عکس‌ها و فیلم‌ها</h3>
          <p className="mt-2 text-pretty text-muted-foreground">
            عکس‌ها (عکس سگ و عکس‌های درخواست ارزیابی) با یه نشانی طولانی و غیرقابل حدس ذخیره می‌شن؛ هر کسی که نشانی
            دقیقش رو داشته باشه می‌تونه ببیندشون. فیلم‌های درخواست ارزیابی این‌طور نیستن: خصوصی‌ان و فقط خودت و{" "}
            {HEAD_TRAINER.firstName} می‌بینینشون.
          </p>
        </div>
      </div>
    </div>
  );
}
