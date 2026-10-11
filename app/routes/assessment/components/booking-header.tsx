import { ClockIcon, GiftIcon, MapPinIcon } from "lucide-react";

import { Fact } from "~/components/fact";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Booking Header =====*/
/**
 * The first screen, on plain slate with flat gold like the home hero, so the gold leaf in the slip below is the one
 * thing that shines. Says what will happen, in Arman's voice, before asking for anything.
 */
export function BookingHeader() {
  return (
    <header
      aria-labelledby="assessment-title"
      className="site-container grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-8 pt-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:pt-14"
    >
      {/*------ Title, Promise and Facts ------*/}
      <div>
        <h1 id="assessment-title" className="font-display text-display leading-[1.45] font-bold text-balance">
          ارزیابی رایگان با {HEAD_TRAINER.firstName}
        </h1>
        <p className="mt-4 max-w-[38rem] text-lead text-pretty text-foreground/85">
          یک ساعت با سگت، در خانه‌ی خودت یا بیرون. آخرش می‌گویم از کدام دوره شروع کنید.
        </p>

        <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-5 border-y py-5">
          <Fact icon={GiftIcon} label="هزینه">
            رایگان
          </Fact>
          <Fact icon={ClockIcon} label="مدت">
            حدود ۶۰ دقیقه
          </Fact>
          <Fact icon={MapPinIcon} label="محل">
            خانه‌ی تو یا بیرون
          </Fact>
        </dl>
      </div>

      {/*------ Signed Sentence ------*/}
      <figure className="flex items-center gap-4 lg:pb-5">
        <img
          src={HEAD_TRAINER.photo.src}
          alt=""
          width={HEAD_TRAINER.photo.width}
          height={HEAD_TRAINER.photo.height}
          className="size-16 shrink-0 rounded-full object-cover object-[70%_50%] ring-1 ring-primary/40"
        />
        <div className="leading-snug">
          <blockquote className="font-bold text-pretty">قبل از هر دوره‌ای، خودم سگت را می‌بینم.</blockquote>
          <figcaption className="mt-1 text-sm text-muted-foreground">{HEAD_TRAINER.name}</figcaption>
        </div>
      </figure>
    </header>
  );
}
