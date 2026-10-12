import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { formatNumberFa } from "~/lib/digits";
import { BEHAVIOR_PROBLEM_CATEGORY_LABELS, type BehaviorProblemCategory } from "~/orpc/behavior-request/constants";
import type { Dog } from "~/orpc/dog/contract";
import { DogThumb } from "~/routes/behavior_modification/components/dog-thumb";

/*===== Request Slip =====*/
/**
 * The request as it fills in: the dog, the problem, the videos and the first line of the description. Empty lines read
 * as quiet placeholders. It sits on the sunken plate and holds the page's one gold-leaf object, the send button. Phones
 * show it without the button; their button is in the fixed bar, so there is never a second gold button on screen.
 */
export function RequestSlip({
  dog,
  problem,
  videoCount,
  description,
  pending,
  uploading,
  disabled,
}: {
  dog: Pick<Dog, "name" | "photo"> | null;
  problem: BehaviorProblemCategory | null;
  videoCount: number;
  description: string;
  pending: boolean;
  uploading: boolean;
  /** Not ready to send yet (a field, a video or a dog is missing), or already sent. */
  disabled: boolean;
}) {
  // The first line only: a long description would push the button away.
  const firstLine = description.trim().split("\n")[0] ?? "";

  return (
    <div className="rounded-3xl bg-sunken p-5 shadow-[inset_0_2px_12px_rgb(0_0_0/0.35)] lg:p-8">
      <h2 className="text-sm font-bold text-saffron-text">برگه‌ی درخواست</h2>

      <dl className="mt-4 divide-y">
        <SlipLine label="سگ">
          {dog ? (
            <span className="flex items-center gap-3">
              <DogThumb dog={dog} />
              <span className="min-w-0 truncate text-lg font-extrabold">{dog.name}</span>
            </span>
          ) : (
            <Placeholder>هنوز سگی انتخاب نکرده‌ای</Placeholder>
          )}
        </SlipLine>

        <SlipLine label="مشکل">
          {problem ? (
            <Filled valueKey={problem}>{BEHAVIOR_PROBLEM_CATEGORY_LABELS[problem]}</Filled>
          ) : (
            <Placeholder>هنوز انتخاب نکرده‌ای</Placeholder>
          )}
        </SlipLine>

        <SlipLine label="ویدیو">
          {videoCount > 0 ? (
            <Filled valueKey={String(videoCount)}>{formatNumberFa(videoCount)} ویدیو</Filled>
          ) : (
            <Placeholder>هنوز ویدیویی نفرستاده‌ای</Placeholder>
          )}
        </SlipLine>

        <SlipLine label="توضیح">
          {firstLine ? (
            <Filled valueKey={firstLine}>
              <span className="block truncate font-medium">{firstLine}</span>
            </Filled>
          ) : (
            <Placeholder>هنوز توضیح ننوشته‌ای</Placeholder>
          )}
        </SlipLine>
      </dl>

      <p className="mt-5 text-pretty">آرمان ویدیوها را می‌بیند و برنامه‌ای با قیمت می‌فرستد.</p>
      <p className="mt-2 text-sm text-pretty text-muted-foreground">تا وقتی نپرداخته‌ای هزینه‌ای نداری.</p>
      <Button type="submit" size="lg" disabled={disabled} className="mt-5 hidden w-full lg:flex">
        {pending && <Spinner data-icon="inline-start" />}
        {uploading ? "ویدیو در حال بارگذاری است" : "درخواست را بفرست"}
      </Button>
    </div>
  );
}

/*===== Lines =====*/
function SlipLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-3 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-bold">{children}</dd>
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-muted-foreground">{children}</span>;
}

/** A filled line cross-fades in when its value changes: `key` restarts the animation. */
function Filled({ valueKey, children }: { valueKey: string; children: React.ReactNode }) {
  return (
    <span key={valueKey} className="block motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in">
      {children}
    </span>
  );
}
