import { DogEmptyState } from "~/components/dog-empty-state";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== No Dogs =====*/
/** The Dashboard of an account with no dog yet: the dog asks to be introduced, and one gold button does it. */
export function NoDogs() {
  return (
    <DogEmptyState
      bubble="من هنوز اینجا نیستم! معرفی‌م کن"
      title="اولین سگت را معرفی کن"
      action={{ label: "معرفی سگ", to: "/account/dogs/new" }}
    >
      اسم و نژادش را بنویس تا {HEAD_TRAINER.firstName} بشناسدش. بعدش می‌تونی ارزیابی رایگانش را بخوای.
    </DogEmptyState>
  );
}
