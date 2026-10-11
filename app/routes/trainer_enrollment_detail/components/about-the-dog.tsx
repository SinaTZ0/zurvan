import { CopyIcon, PhoneIcon } from "lucide-react";

import { DogPortrait } from "~/components/dog-portrait";
import { DogProfile } from "~/components/dog-profile";
import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { toPersianDigits } from "~/lib/digits";
import { describeDog } from "~/lib/dog-format";
import { TRAINING_GOAL_LABELS } from "~/orpc/assessment/constants";
import type { TrainerEnrollment } from "~/orpc/enrollment/contract";
import { formatRecordedDate } from "~/routes/trainer_enrollment_detail/format";

/*===== About the Dog =====*/
/**
 * The start column: the dog with its tag, the notes its owner wrote (set large, because they are what gets read in
 * the car), the owner and what they asked for, and the profile. Unboxed and ruled with hairlines, so the card beside it
 * stays the one raised thing.
 */
export function AboutTheDog({ enrollment }: { enrollment: TrainerEnrollment }) {
  const { dog } = enrollment;
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
      <Request enrollment={enrollment} />
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
function Request({ enrollment }: { enrollment: TrainerEnrollment }) {
  const { customer, address, boarding, preferredTimes, trainingGoal, isRetake, assessment } = enrollment;

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.add({ title: "نشانی کپی شد.", type: "success" });
    } catch {
      // Clipboard access can be refused (an insecure page, a denied permission).
      toast.add({ title: "کپی نشد. نشانی را با دست انتخاب کن.", type: "error" });
    }
  }

  return (
    <section aria-labelledby="request-title">
      <h2 id="request-title" className="border-b pb-3 text-lg font-extrabold">
        صاحب سگ و درخواستش
      </h2>
      <dl className="divide-y">
        {/*------ Owner ------*/}
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

        {/*------ Preferred Times ------*/}
        <div className="py-4">
          <dt className="text-sm text-muted-foreground">وقت‌هایی که برایش مناسب است</dt>
          <dd className="mt-2 border-s-2 border-primary/40 ps-4 text-pretty whitespace-pre-line">
            {preferredTimes || <span className="text-muted-foreground">چیزی ننوشته.</span>}
          </dd>
        </div>

        {/*------ Place ------*/}
        <div className="py-4">
          <dt className="text-sm text-muted-foreground">{boarding ? "پانسیون" : "نشانی"}</dt>
          {boarding || !address ? (
            <dd className="mt-1 font-bold text-pretty">سگ در پانسیون می‌ماند و آموزش همان‌جا ادامه دارد.</dd>
          ) : (
            <dd className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span className="min-w-0 font-bold text-pretty">{address}</span>
              <Button type="button" variant="ghost" size="sm" onClick={copyAddress} className="text-primary">
                <CopyIcon aria-hidden data-icon="inline-start" />
                نشانی را کپی کن
              </Button>
            </dd>
          )}
        </div>

        {/*------ Goal ------*/}
        <div className="py-4">
          <dt className="text-sm text-muted-foreground">هدف</dt>
          <dd className="mt-1 font-bold">
            {TRAINING_GOAL_LABELS[trainingGoal]}
            {isRetake && (
              <span className="ms-2 text-sm font-normal text-muted-foreground">(دوره را قبلاً گذرانده)</span>
            )}
          </dd>
        </div>

        {/*------ Assessment ------*/}
        {assessment && (
          <div className="py-4">
            <dt className="text-sm text-muted-foreground">
              یادداشت ارزیابی
              {assessment.completedAt ? `، ${formatRecordedDate(assessment.completedAt)}` : ""}
            </dt>
            <dd className="mt-2 flex flex-col gap-2">
              {assessment.trainerNotes && (
                <p className="border-s-2 border-primary/40 ps-4 text-pretty whitespace-pre-line">
                  {assessment.trainerNotes}
                </p>
              )}
              <Link
                to={`/trainer/assessments/${assessment.id}`}
                className="w-fit rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
              >
                ارزیابی را باز کن
              </Link>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
