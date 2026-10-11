import { ORPCError } from "@orpc/client";
import { useEffect, useRef, useState } from "react";
import { useRevalidator } from "react-router";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { describeApiFailure } from "~/lib/api-error";
import { errorDataSchema } from "~/orpc/errors";
import { useApplyDiscount, useRemoveDiscount } from "~/routes/account_checkout/hooks/use-checkout-actions";

/*===== Discount Row =====*/
/**
 * «کد تخفیف داری؟»: quiet until opened, then one field and «اعمال». A rejected code shows the server's reason under
 * the field and keeps what was typed. An applied code is a line of the receipt, drawn by the parent with `AppliedCode`.
 */
export function DiscountRow({
  orderId,
  onNotPayable,
}: {
  orderId: string;
  /** The order changed under the customer (it was paid or cancelled elsewhere): the page says so above the button. */
  onNotPayable: (message: string) => void;
}) {
  const revalidator = useRevalidator();
  const apply = useApplyDiscount();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [reason, setReason] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Opening the field is a request to type in it.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const onSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReason(null);
    apply.mutate(
      { id: orderId, code },
      {
        onSuccess: async () => {
          setCode("");
          setOpen(false);
          await revalidator.revalidate();
        },
        onError: async (error) => {
          if (error instanceof ORPCError && error.code === "NOT_PAYABLE") {
            const parsed = errorDataSchema.safeParse(error.data);
            onNotPayable(parsed.success ? (parsed.data.errors[0] ?? "این سفارش دیگر قابل پرداخت نیست.") : "");
            await revalidator.revalidate();
            return;
          }
          const failure = describeApiFailure({ error, fallback: "کد اعمال نشد. دوباره امتحان کن." });
          setReason(failure.fields.code ?? failure.message);
        },
      },
    );
  };

  if (!open) {
    return (
      <div className="py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
        >
          کد تخفیف داری؟
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-2 py-3 motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in"
    >
      <label htmlFor="checkout-code" className="text-sm text-muted-foreground">
        کد تخفیف
      </label>
      <div className="flex gap-2">
        <Input
          id="checkout-code"
          dir="ltr"
          ref={inputRef}
          autoComplete="off"
          autoCapitalize="characters"
          value={code}
          aria-invalid={!!reason}
          aria-describedby={reason ? "checkout-code-error" : undefined}
          onChange={(event) => setCode(event.target.value)}
          className="text-start uppercase"
        />
        <Button type="submit" variant="outline" disabled={apply.isPending || code.trim() === ""} className="shrink-0">
          {apply.isPending && <Spinner data-icon="inline-start" />}
          اعمال
        </Button>
      </div>
      {reason && (
        <p id="checkout-code-error" role="alert" className="text-sm text-destructive">
          {reason}
        </p>
      )}
    </form>
  );
}

/*===== Applied Code =====*/
/** The applied code beside its «حذف». Rendered inside the discount's receipt line. */
export function AppliedCode({
  orderId,
  code,
  onNotPayable,
}: {
  orderId: string;
  code: string;
  onNotPayable: (message: string) => void;
}) {
  const revalidator = useRevalidator();
  const remove = useRemoveDiscount();

  const onRemove = () => {
    remove.mutate(
      { id: orderId },
      {
        onSuccess: () => revalidator.revalidate(),
        onError: async (error) => {
          const failure = describeApiFailure({ error, fallback: "کد برداشته نشد. دوباره امتحان کن." });
          onNotPayable(failure.message ?? "");
          await revalidator.revalidate();
        },
      },
    );
  };

  return (
    <span className="flex flex-wrap items-center gap-x-3">
      <span>
        کد <bdi dir="ltr">{code}</bdi>
      </span>
      <button
        type="button"
        onClick={onRemove}
        disabled={remove.isPending}
        className="rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline disabled:opacity-50"
      >
        حذف
      </button>
    </span>
  );
}
