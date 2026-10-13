import { cn } from "cn";
import { CheckIcon, PawPrintIcon } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Link } from "~/components/link";
import { MediaImage } from "~/components/media-image";
import { FieldError } from "~/components/ui/field";
import type { Media } from "~/orpc/media/contract";

/*===== Types =====*/
/** Whether a dog can ask for an evaluation now (app-spec F3, "Who can request an evaluation"). */
export type DogRequestState = "requestable" | "pending" | "evaluated";

export type DogChoice = {
  id: string;
  name: string;
  breed: string | null;
  photo: Media | null;
  state: DogRequestState;
};

/*===== Dog Picker =====*/
/**
 * «کدوم سگ؟»: one card per dog, native radios underneath so arrow keys, the form library and screen readers behave
 * as for any radio group. A dog that can't ask now stays in the list, disabled, with the reason: hiding it would leave
 * the owner wondering where it went.
 */
export function DogPicker({
  dogs,
  registration,
  error,
}: {
  dogs: readonly DogChoice[];
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  const errorId = `${registration.name}-error`;

  return (
    <fieldset className="min-w-0" aria-invalid={!!error} aria-describedby={error ? errorId : undefined}>
      <legend className="text-lg font-extrabold">کدوم سگ؟</legend>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {dogs.map((dog) => {
          const requestable = dog.state === "requestable";
          return (
            <li key={dog.id}>
              <label className="group/dog relative block">
                <input type="radio" value={dog.id} disabled={!requestable} className="peer sr-only" {...registration} />
                {/*------ Card ------*/}
                <span
                  className={cn(
                    "flex min-h-24 items-center gap-3 rounded-2xl border bg-sunken p-3 pe-12 transition-colors",
                    error ? "border-destructive/50" : "border-input/60",
                    requestable
                      ? "cursor-pointer hover:border-primary/50 motion-safe:transition-[transform,border-color,background-color] motion-safe:hover:-translate-y-0.5"
                      : "cursor-not-allowed",
                    "peer-checked:border-primary peer-checked:bg-primary/10",
                    "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                  )}
                >
                  <DogThumb dog={dog} dimmed={!requestable} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className={cn("truncate font-extrabold", !requestable && "text-muted-foreground")}>
                      {dog.name}
                    </span>
                    {dog.breed && <span className="truncate text-sm text-muted-foreground">{dog.breed}</span>}
                    {dog.state === "pending" && (
                      <span className="mt-1 text-xs text-pretty text-muted-foreground">
                        درخواستش در انتظار پاسخ است
                      </span>
                    )}
                    {dog.state === "evaluated" && (
                      <span className="mt-1 text-xs text-pretty text-muted-foreground">
                        ارزیابی شده؛ دوره‌هایش باز است{" "}
                        <Link
                          to="/courses"
                          className="relative z-10 rounded-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          دوره‌ها را ببین
                        </Link>
                      </span>
                    )}
                  </span>
                </span>
                {/*------ Tick ------*/}
                <span
                  aria-hidden
                  className="pointer-events-none absolute end-3.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 group-has-[:checked]/dog:opacity-100 motion-safe:transition-opacity"
                >
                  <CheckIcon className="size-4" strokeWidth={3} />
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {/*------ Errors and the way to add a dog ------*/}
      <div id={errorId} className="mt-2">
        <FieldError errors={[error ? { message: error } : undefined]} />
      </div>
      <Link
        to="/account/dogs/new?redirectTo=/assessment"
        className="mt-3 inline-block rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        + معرفی سگ تازه
      </Link>
    </fieldset>
  );
}

/*===== Dog Thumb =====*/
/** The dog's photo, or a paw on a plain tile while the owner hasn't added one. */
function DogThumb({ dog, dimmed }: { dog: DogChoice; dimmed: boolean }) {
  return (
    <span
      className={cn(
        "grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground",
        dimmed && "opacity-60",
      )}
    >
      {dog.photo ? (
        <MediaImage media={dog.photo} variant="thumb" alt={`عکس ${dog.name}`} className="size-full" />
      ) : (
        <PawPrintIcon aria-hidden className="size-7" strokeWidth={1.6} />
      )}
    </span>
  );
}
