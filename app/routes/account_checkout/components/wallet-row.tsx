import { useId } from "react";

import { Switch } from "~/components/ui/switch";
import { formatToman } from "~/lib/course-format";

/*===== Wallet Row =====*/
/** The switch that spends the wallet first. The parent only renders it for a positive balance. */
export function WalletRow({
  balance,
  checked,
  onCheckedChange,
}: {
  /** Rial. */
  balance: number;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block font-bold">از کیف پولم برداشته شود</span>
        <span className="block text-sm text-muted-foreground">موجودی: {formatToman(balance)}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
