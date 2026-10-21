import { SearchIcon, XIcon } from "lucide-react";
import { useRef } from "react";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "~/components/ui/input-group";

/*===== User Search Field =====*/
/**
 * The roll's search, a grained field on the sunken paper, as on the Dogs register. The value is the URL's `q`, which
 * the page updates on every keystroke (debounced in the URL). It is not a form: the list filters as he types, so Enter
 * has nothing to submit. The clear button (40px) appears once there is something to clear and gives focus back to the
 * field.
 */
export function UserSearchField({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <search>
      <label htmlFor="admin-users-search" className="sr-only">
        جستجوی اسم یا شماره
      </label>
      <InputGroup className="h-11 rounded-full border-foreground/15 bg-sunken paper-grain shadow-[inset_0_1px_0_rgb(0_0_0/0.5)] hover:border-foreground/25 dark:bg-sunken">
        <InputGroupAddon>
          <SearchIcon strokeWidth={1.7} aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          id="admin-users-search"
          type="search"
          value={value}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="اسم یا شماره‌ی موبایل"
          onChange={(event) => onChange(event.target.value)}
          // Our own clear button replaces the browser's cross, so both don't show.
          className="text-sm placeholder:text-muted-foreground/80 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none"
        />
        {value !== "" && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="پاک کردن جستجو"
              size="icon-sm"
              className="size-10 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => {
                onClear();
                inputRef.current?.focus();
              }}
            >
              <XIcon aria-hidden />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </search>
  );
}
