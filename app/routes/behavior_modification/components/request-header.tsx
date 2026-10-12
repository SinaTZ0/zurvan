import { CameraIcon, LockKeyholeIcon, ReceiptTextIcon } from "lucide-react";

import { Fact } from "~/components/fact";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Request Header =====*/
/**
 * The first screen, on plain slate, so the gold leaf of the request button is the only gold that shines. It says what
 * happens next before asking for anything: Arman looks at a video and answers with a plan.
 */
export function RequestHeader() {
  return (
    <header
      aria-labelledby="behavior-request-title"
      className="site-container grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-8 pt-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:pt-14"
    >
      <div>
        <h1 id="behavior-request-title" className="font-display text-display leading-[1.45] font-bold text-balance">
          مشکل رفتاری سگت را نشانم بده
        </h1>
        <p className="mt-4 max-w-[38rem] text-lead text-pretty text-foreground/85">
          ویدیویی از رفتار سگت بفرست. خودم می‌بینم و می‌گویم چند جلسه و با چه هزینه‌ای درستش می‌کنیم.
        </p>

        <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-5 border-y py-5">
          <Fact icon={CameraIcon} label="برای هر سن و نژاد">
            سگ تو، هر سنی
          </Fact>
          <Fact icon={LockKeyholeIcon} label="ویدیوها خصوصی می‌مانند">
            فقط آرمان و مربی سگت
          </Fact>
          <Fact icon={ReceiptTextIcon} label="پاسخ">
            با برنامه و قیمت
          </Fact>
        </dl>
      </div>

      <figure className="flex items-center gap-4 lg:pb-5">
        <img
          src={HEAD_TRAINER.photo.src}
          alt=""
          width={HEAD_TRAINER.photo.width}
          height={HEAD_TRAINER.photo.height}
          className="size-16 shrink-0 rounded-full object-cover object-[70%_50%] ring-1 ring-primary/40"
        />
        <div className="leading-snug">
          <blockquote className="font-bold text-pretty">ویدیو را خودم می‌بینم، بعد می‌گویم چه کار کنیم.</blockquote>
          <figcaption className="mt-1 text-sm text-muted-foreground">{HEAD_TRAINER.name}</figcaption>
        </div>
      </figure>
    </header>
  );
}
