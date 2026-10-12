import { CopyIcon, PhoneIcon } from "lucide-react";

import { DogPortrait } from "~/components/dog-portrait";
import { DogProfile } from "~/components/dog-profile";
import { VideoPlayer } from "~/components/video-player";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { describeDog } from "~/lib/dog-format";
import { toPersianDigits } from "~/lib/digits";
import type { TrainerBehaviorRequest } from "~/orpc/behavior-request/contract";

/*===== The Case =====*/
/**
 * Everything to read before answering: the videos first, each on its own frame, then what the owner wrote, the dog
 * with its notes set large, and where and when, with the owner's contact. Unboxed and ruled, so the answer card beside
 * it stays the one raised thing.
 */
export function TheCase({ behaviorRequest }: { behaviorRequest: TrainerBehaviorRequest }) {
  const { dog, videos, description } = behaviorRequest;
  const facts = describeDog(dog);

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="videos-title" className="flex flex-col gap-5">
        <h2 id="videos-title" className="border-b pb-3 text-lg font-extrabold">
          ویدیوها
        </h2>
        {videos.length === 0 ? (
          <p className="text-muted-foreground">ویدیویی فرستاده نشده.</p>
        ) : (
          videos.map((video) => <VideoPlayer key={video.id} video={video} />)
        )}
      </section>

      <section aria-labelledby="description-title" className="flex flex-col gap-3">
        <h2 id="description-title" className="sr-only">
          توضیح صاحب سگ
        </h2>
        <blockquote className="border-s-2 border-primary/40 ps-4 text-lg leading-8 text-pretty whitespace-pre-line">
          {description}
        </blockquote>
      </section>

      <div className="flex flex-col gap-5">
        <DogPortrait
          name={dog.name}
          microchipNumber={dog.microchipNumber}
          photo={dog.photo}
          finish="leaf"
          className="mx-auto w-full max-w-64 lg:max-w-80"
        />
        {facts && <p className="text-pretty text-muted-foreground">{facts}</p>}
        <Notes behavior={dog.behaviorNotes} medical={dog.medicalNotes} />
        <DogProfile dog={dog} />
      </div>

      <Where behaviorRequest={behaviorRequest} />
    </div>
  );
}

/*===== Notes =====*/
function Notes({ behavior, medical }: { behavior: string | null; medical: string | null }) {
  const notes = [
    { label: "رفتار", text: behavior },
    { label: "سلامت", text: medical },
  ];

  return (
    <section aria-labelledby="owner-notes-title">
      <h3 id="owner-notes-title" className="border-b pb-3 text-lg font-extrabold">
        یادداشت‌های صاحب سگ
      </h3>
      <div className="mt-5 flex flex-col gap-6">
        {notes.map(({ label, text }) => (
          <div key={label}>
            <h4 className="mb-2 text-sm font-bold text-muted-foreground">{label}</h4>
            {text ? (
              <p className="border-s-2 border-primary/40 ps-4 text-lg leading-8 text-pretty whitespace-pre-line">
                {text}
              </p>
            ) : (
              <p className="text-muted-foreground">چیزی ننوشته.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/*===== Where =====*/
function Where({ behaviorRequest }: { behaviorRequest: TrainerBehaviorRequest }) {
  const { address, preferredTimes, customer } = behaviorRequest;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      toast.add({ title: "نشانی کپی شد.", type: "success" });
    } catch {
      // Clipboard access can be refused (an insecure page, a denied permission).
      toast.add({ title: "کپی نشد. نشانی را با دست انتخاب کن.", type: "error" });
    }
  }

  return (
    <section aria-labelledby="where-title">
      <h2 id="where-title" className="border-b pb-3 text-lg font-extrabold">
        محل و زمان
      </h2>
      <dl className="divide-y">
        <div className="py-4">
          <dt className="text-sm text-muted-foreground">نشانی جلسه‌ها</dt>
          <dd className="mt-1 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <span className="min-w-0 font-bold text-pretty whitespace-pre-line">{address}</span>
            <Button type="button" variant="ghost" size="sm" onClick={copyAddress} className="text-primary">
              <CopyIcon aria-hidden data-icon="inline-start" />
              نشانی را کپی کن
            </Button>
          </dd>
        </div>
        <div className="py-4">
          <dt className="text-sm text-muted-foreground">زمان‌های مناسب</dt>
          <dd className="mt-2 border-s-2 border-primary/40 ps-4 text-pretty whitespace-pre-line">{preferredTimes}</dd>
        </div>
        <div className="py-4">
          <dt className="text-sm text-muted-foreground">صاحب سگ</dt>
          <dd className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <span className="font-bold">{customer.name}</span>
            {customer.phoneNumber ? (
              <a
                href={`tel:${customer.phoneNumber}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-sm font-bold text-primary underline-offset-4 hover:underline"
              >
                <PhoneIcon aria-hidden strokeWidth={1.7} className="size-4" />
                <span dir="ltr" className="tabular-nums">
                  {toPersianDigits(customer.phoneNumber)}
                </span>
              </a>
            ) : (
              <span className="text-muted-foreground">شماره ثبت نشده</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
