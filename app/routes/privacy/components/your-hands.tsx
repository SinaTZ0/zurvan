import { CENTER_PHONE } from "~/lib/contact";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Your Hands Section =====*/
// What the visitor can change alone, and what only the trainer can. The `tel:` link is a plain anchor: the router's
// `Link` is for in-app paths. The number is shown in Latin-direction, since it is read as digits.
export function YourHands() {
  return (
    <section id="yours" aria-labelledby="yours-title" className="scroll-mt-24">
      <h2 id="yours-title" className="font-display text-h2 font-black text-balance">
        چی رو خودت عوض می‌کنی
      </h2>
      <div className="mt-6 max-w-prose space-y-4 text-pretty text-muted-foreground">
        <p>
          اسمت و اطلاعات سگ‌هات رو خودت توی حسابت عوض می‌کنی. بعد از ارزیابی، تاریخ تولد و نژاد سگ قفل می‌شه و فقط{" "}
          {HEAD_TRAINER.firstName} می‌تونه عوض‌شون کنه. سگ‌ها و پرداخت‌ها از حساب پاک نمی‌شن، چون ارزیابی‌ها و دوره‌ها
          بهشون وصلن.
        </p>
        <p>
          اگه چیزی هست که خودت نمی‌تونی درست کنی،{" "}
          <a
            href={`tel:${CENTER_PHONE.tel}`}
            className="rounded-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            با مرکز تماس بگیر
          </a>
          .{" "}
          <bdi dir="ltr" className="font-bold text-foreground">
            {CENTER_PHONE.display}
          </bdi>
        </p>
      </div>
    </section>
  );
}
