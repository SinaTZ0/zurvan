import { Receipt, ReceiptLine, ReceiptLines, ReceiptTotal } from "~/components/receipt";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import type { Dog } from "~/orpc/dog/contract";
import type { BookingOptions } from "~/orpc/order/contract";
import { DogThumb } from "~/routes/assessment/components/dog-thumb";

/** The button's words, shared with the phone bar so the two never differ. */
export const BOOKING_BUTTON_LABEL = "ادامه و پرداخت";
export const BOOKING_BLOCKED_LABEL = "یکی از سگ‌ها را انتخاب کن";

/*===== Booking Receipt =====*/
/**
 * The booking as it fills in (رسید رزرو): the dog, the course, boarding if chosen, and the total, then the refund
 * policy's sentence and the page's one gold-leaf button. Phones show the receipt in the page flow without the button;
 * theirs is in the fixed bar, so there is never a second gold button on screen.
 */
export function BookingReceipt({
  course,
  kind,
  dog,
  boarding,
  total,
  pending,
  blocked,
}: {
  course: BookingOptions["course"];
  kind: BookingOptions["kind"];
  dog: Pick<Dog, "name" | "photo"> | null;
  boarding: boolean;
  /** Rial: the price, plus boarding when chosen. */
  total: number;
  pending: boolean;
  /** No dog can book, so the button waits. */
  blocked: boolean;
}) {
  const isTest = kind === "test";

  return (
    <Receipt title="رسید رزرو">
      <ReceiptLines>
        {/*------ Dog ------*/}
        <ReceiptLine label="سگ" placeholder={!dog}>
          {dog ? (
            <Filled valueKey={dog.name}>
              <span className="flex items-center gap-3">
                <DogThumb dog={dog} />
                <span className="min-w-0 truncate text-lg font-extrabold">{dog.name}</span>
              </span>
            </Filled>
          ) : (
            "هنوز سگی انتخاب نکرده‌ای"
          )}
        </ReceiptLine>

        {/*------ Course ------*/}
        <ReceiptLine label={isTest ? "تست" : "دوره"} amount={course.price ?? 0}>
          <span className="text-pretty">{course.title}</span>
        </ReceiptLine>

        {/*------ Boarding ------*/}
        {boarding && course.boardingPrice !== null && (
          <ReceiptLine label="پانسیون" amount={course.boardingPrice}>
            <Filled valueKey="boarding">سگ در پانسیون می‌ماند</Filled>
          </ReceiptLine>
        )}
      </ReceiptLines>

      <ReceiptTotal label="مبلغ پرداخت" amount={total} />

      {/*------ Refund and Button ------*/}
      <p className="mt-5 text-sm text-pretty text-muted-foreground">{course.refundPolicy.description}</p>
      <Button type="submit" size="lg" disabled={pending || blocked} className="mt-4 hidden w-full lg:flex">
        {pending && <Spinner data-icon="inline-start" />}
        {blocked ? BOOKING_BLOCKED_LABEL : BOOKING_BUTTON_LABEL}
      </Button>
    </Receipt>
  );
}

/** A filled line cross-fades in when its value changes: `key` restarts the animation. */
function Filled({ valueKey, children }: { valueKey: string; children: React.ReactNode }) {
  return (
    <span key={valueKey} className="block motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in">
      {children}
    </span>
  );
}
