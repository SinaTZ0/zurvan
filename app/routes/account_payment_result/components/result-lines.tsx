import { ReceiptLine, ReceiptLines } from "~/components/receipt";
import type { CheckoutOrder } from "~/orpc/order/contract";
import { DogThumb } from "~/routes/assessment/components/dog-thumb";

/*===== Result Lines =====*/
/**
 * The checkout's receipt lines, read-only: the dog, the course (and boarding), the code and, once paid, what the
 * wallet covered. The same words as Checkout, so the receipt that was paid is recognisably the one that was shown.
 */
export function ResultLines({ order, showWallet }: { order: CheckoutOrder; showWallet: boolean }) {
  const [item] = order.items;
  if (!item) return null;
  const isTest = item.kind === "test";

  return (
    <ReceiptLines>
      <ReceiptLine label="سگ">
        <span className="flex items-center gap-3">
          <DogThumb dog={item.dog} />
          <span className="min-w-0 truncate text-lg font-extrabold">{item.dog.name}</span>
        </span>
      </ReceiptLine>

      <ReceiptLine label={isTest ? "تست" : "دوره"} amount={item.unitPrice - item.boardingPrice}>
        <span className="block text-pretty">{item.course.title}</span>
      </ReceiptLine>

      {item.boarding && (
        <ReceiptLine label="پانسیون" amount={item.boardingPrice}>
          سگ در پانسیون می‌ماند
        </ReceiptLine>
      )}

      <div className="py-3">
        <dt className="sr-only">جزئیات رزرو</dt>
        <dd className="text-sm text-pretty text-muted-foreground">
          {item.boarding ? "پانسیون" : item.address}
          {(item.boarding || item.address) && "، "}
          {item.preferredTimes}
        </dd>
      </div>

      {order.discountCode && (
        <ReceiptLine label="تخفیف" credit amount={order.discountAmount}>
          کد <bdi dir="ltr">{order.discountCode}</bdi>
        </ReceiptLine>
      )}

      {showWallet && order.paidFromWallet > 0 && (
        <ReceiptLine label="کیف پول" credit amount={order.paidFromWallet}>
          از کیف پول
        </ReceiptLine>
      )}
    </ReceiptLines>
  );
}
