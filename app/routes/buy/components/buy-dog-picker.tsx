import { cn } from "cn";
import { PlusIcon } from "lucide-react";

import { DogThumb } from "~/components/dog-thumb";
import { Link } from "~/components/link";
import { describeDog } from "~/lib/dog-format";
import type { Dog } from "~/orpc/dog/contract";

/*===== Buy Dog Picker =====*/
/**
 * Which dog is this for? One link per dog, each to `/buy?dog=<id>`, so the choice is in the address (Back and a shared
 * link both work) and the courses below are fetched for that dog by the server. A customer with no dog is asked to add
 * one first, and comes back here.
 */
export function BuyDogPicker({ dogs, dogId }: { dogs: Dog[]; dogId: string | null }) {
  if (dogs.length === 0) {
    return (
      <div className="max-w-xl rounded-3xl border border-border bg-card p-6">
        <p className="font-bold">اول سگت را معرفی کن</p>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          دوره‌ها برای هر سگ جدا حساب می‌شود؛ بعد از معرفی، همین‌جا برمی‌گردی.
        </p>
        <Link
          to={`/account/dogs/new?redirectTo=${encodeURIComponent("/buy")}`}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
        >
          <PlusIcon aria-hidden className="size-4" />
          معرفی سگ
        </Link>
      </div>
    );
  }

  return (
    <nav aria-label="سگ‌های من">
      <p className="text-sm font-bold text-muted-foreground">برای کدوم سگ؟</p>
      <ul className="mt-3 flex flex-wrap gap-3">
        {dogs.map((dog) => {
          const picked = dog.id === dogId;
          return (
            <li key={dog.id}>
              <Link
                to={`/buy?dog=${encodeURIComponent(dog.id)}`}
                aria-current={picked ? "true" : undefined}
                preventScrollReset
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-card p-3 pe-5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  picked ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                )}
              >
                <DogThumb name={dog.name} photo={dog.photo} />
                <span className="flex flex-col">
                  <span className="font-bold">{dog.name}</span>
                  <span className="text-xs text-muted-foreground">{describeDog(dog)}</span>
                </span>
              </Link>
            </li>
          );
        })}
        <li className="w-full sm:w-auto">
          <Link
            to={`/account/dogs/new?redirectTo=${encodeURIComponent("/buy")}`}
            className="flex h-full min-h-20 items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-5 text-sm font-bold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground sm:justify-start"
          >
            <PlusIcon aria-hidden className="size-4" />
            سگ دیگر
          </Link>
        </li>
      </ul>
    </nav>
  );
}
