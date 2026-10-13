import { CustomerContact } from "~/components/customer-contact";
import { DogEvaluationStamp, type DogEvaluationState } from "~/components/dog-evaluation-stamp";
import { DogPhoto } from "~/components/dog-photo";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminDog } from "~/orpc/dog/contract";

/*===== Identity Panel =====*/
/**
 * Who the dog is: its photo (the engraved tag when it has none; that tag is 192px tall, and the frame keeps that
 * space), the evaluation stamp, and the owner one call away. The Admin can't change the photo; it is the owner's upload.
 */
export function IdentityPanel({ dog, state }: { dog: AdminDog; state: DogEvaluationState }) {
  return (
    <section aria-label="هویت سگ" className="overflow-hidden rounded-2xl border border-border bg-card">
      <DogPhoto
        name={dog.name}
        photo={dog.photo}
        microchipNumber={dog.microchipNumber}
        variant="card"
        priority
        className="aspect-[16/10] w-full lg:aspect-[4/3]"
      />

      <div className="flex flex-col gap-4 p-4">
        <DogEvaluationStamp state={state} className="w-fit" />

        {/*------ Owner ------*/}
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">صاحب</p>
          <CustomerContact
            name={dog.owner.name}
            phoneNumber={dog.owner.phoneNumber}
            variant="call"
            className="[&>a]:max-sm:w-full"
          />
        </div>

        <p className="text-xs text-muted-foreground">ثبت‌شده در {formatJalaliTimestamp(dog.createdAt)}</p>
      </div>
    </section>
  );
}
