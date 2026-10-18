import { SearchIcon, XIcon } from "lucide-react";
import { useRef } from "react";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "~/components/ui/input-group";

/*===== Dog Search Field =====*/
/**
 * The register's search. The value is the URL's `q`, which the page updates on every keystroke (debounced in the URL).
 * It is not a form: the list filters as one types, so Enter has nothing to submit.
 */
export function DogSearchField({
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
      <label htmlFor="admin-dogs-search" className="sr-only">
        جستجوی سگ یا صاحبش
      </label>
      <InputGroup className="h-11 rounded-full">
        <InputGroupAddon>
          <SearchIcon strokeWidth={1.7} aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          id="admin-dogs-search"
          type="search"
          value={value}
          autoComplete="off"
          placeholder="اسم سگ، نژاد، شماره‌ی پرونده، اسم یا شماره‌ی صاحب"
          onChange={(event) => onChange(event.target.value)}
          // Our own clear button replaces the browser's cross, so both don't show.
          className="[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none"
        />
        {value !== "" && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="پاک کردن جست‌وجو"
              size="icon-sm"
              className="rounded-full"
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
