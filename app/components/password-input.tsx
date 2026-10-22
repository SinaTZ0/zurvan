import { EyeIcon, EyeOffIcon, LockKeyholeIcon } from "lucide-react";
import { useState } from "react";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "~/components/ui/input-group";
import { m } from "~/paraglide/messages";

/*===== Password Input =====*/
/**
 * A password field with a lock at its start and a button at its end that shows what was typed. Showing it is the person's
 * choice, per field, and every field starts hidden: a long password typed blind on a phone is how people lock themselves
 * out. The text reads left to right (passwords are mostly Latin), and the field takes `register()`'s props like any
 * input. Pass `autoComplete` as `current-password` or `new-password` so a password manager knows which it is.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof InputGroupInput>, "type" | "dir">) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <InputGroup>
      <InputGroupAddon>
        <LockKeyholeIcon strokeWidth={1.7} aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        type={isRevealed ? "text" : "password"}
        dir="ltr"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={className ?? "text-start text-lg"}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={isRevealed ? m.shared_password_hide() : m.shared_password_show()}
          aria-pressed={isRevealed}
          onClick={() => setIsRevealed((revealed) => !revealed)}
        >
          {isRevealed ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
