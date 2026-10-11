import { CopyIcon, PhoneIcon } from "lucide-react";

import { DogPortrait } from "~/components/dog-portrait";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { describeDog } from "~/lib/dog-format";
import { toPersianDigits } from "~/lib/digits";
import { MEETING_PLACE_KIND_LABELS, TRAINING_GOAL_LABELS } from "~/orpc/assessment/constants";
import type { TrainerAssessment } from "~/orpc/assessment/contract";
import { DogProfile } from "~/components/dog-profile";

/*===== Before You Go =====*/
/**
 * Everything to read before knocking on the door: the dog with its tag, its profile, the notes the owner wrote (set
 * larger, because they are what gets read in the car), and the owner's request, place and phone. Unboxed, ruled with
 * hairlines, so the form beside it stays the one raised thing.
 */
export function BeforeYouGo({ assessment }: { assessment: TrainerAssessment }) {
  const { dog } = assessment;
  const facts = [dog.breed, describeDog(dog)].filter(Boolean).join("، ");

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <DogPortrait
          name={dog.name}
          microchipNumber={dog.microchipNumber}
          photo={dog.photo}
          finish="leaf"
          priority
          className="mx-auto w-full max-w-80 lg:max-w-none"
        />
        <p className="text-pretty text-muted-foreground">{facts}</p>
      </div>

      <Notes behavior={dog.behaviorNotes} medical={dog.medicalNotes} />
      <Request assessment={assessment} />
      <DogProfile dog={dog} />
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
      <h2 id="owner-notes-title" className="border-b pb-3 text-lg font-extrabold">
        یادداشت‌های صاحب سگ
      </h2>
      <div className="mt-5 flex flex-col gap-6">
        {notes.map(({ label, text }) => (
          <div key={label}>
            <h3 className="mb-2 text-sm font-bold text-muted-foreground">{label}</h3>
            {text ? (
              // The owner's own words, line breaks included, larger than the profile because this is what to read first.
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

/*===== Request =====*/
function Request({ assessment }: { assessment: TrainerAssessment }) {
  const { trainingGoal, customerNote, placeKind, place, customer } = assessment;

  async function copyPlace() {
    try {
      await navigator.clipboard.writeText(place);
      toast.add({ title: "نشانی کپی شد.", type: "success" });
    } catch {
      // Clipboard access can be refused (an insecure page, a denied permission).
      toast.add({ title: "کپی نشد. نشانی را با دست انتخاب کن.", type: "error" });
    }
  }

  return (
    <section aria-labelledby="request-title">
      <h2 id="request-title" className="border-b pb-3 text-lg font-extrabold">
        درخواست صاحب سگ
      </h2>
      <dl className="divide-y">
        <div className="py-4">
          <dt className="text-sm text-muted-foreground">هدف</dt>
          <dd className="mt-1 font-bold">{TRAINING_GOAL_LABELS[trainingGoal]}</dd>
        </div>
        <div className="py-4">
          <dt className="text-sm text-muted-foreground">چه چیزی را می‌خواهد عوض شود</dt>
          <dd className="mt-2 border-s-2 border-primary/40 ps-4 text-pretty whitespace-pre-line">{customerNote}</dd>
        </div>
        <div className="py-4">
          <dt className="text-sm text-muted-foreground">محل دیدار: {MEETING_PLACE_KIND_LABELS[placeKind]}</dt>
          <dd className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span className="min-w-0 font-bold text-pretty">{place}</span>
            <Button type="button" variant="ghost" size="sm" onClick={copyPlace} className="text-primary">
              <CopyIcon aria-hidden data-icon="inline-start" />
              نشانی را کپی کن
            </Button>
          </dd>
        </div>
        <div className="py-4">
          <dt className="text-sm text-muted-foreground">صاحب سگ</dt>
          <dd className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <span className="font-bold">{customer.name}</span>
            {customer.phoneNumber && (
              <a
                href={`tel:${customer.phoneNumber}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-sm font-bold text-primary underline-offset-4 hover:underline"
              >
                <PhoneIcon aria-hidden strokeWidth={1.7} className="size-4" />
                <span dir="ltr" className="tabular-nums">
                  {toPersianDigits(customer.phoneNumber)}
                </span>
              </a>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
