import { SearchIcon, XIcon } from "lucide-react";
import { useRef } from "react";
import { Form } from "react-router";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "~/components/ui/input-group";
import { MAX_QUERY_LENGTH } from "~/routes/course_catalogue/search-params";

/*===== Search Field =====*/
/**
 * The catalogue's own search. A real GET form, so it works before the page has hydrated; once it has, typing also moves
 * the URL (the route debounces that) and Enter submits at once. The family stays in the URL when searching, so the
 * hidden field carries it for the no-JavaScript submit.
 */
export function SearchField({
  value,
  family,
  onChange,
  onSubmit,
  onClear,
  className,
}: {
  /** What the field shows: the URL's `q`, which updates on every keystroke. */
  value: string;
  family: string | null;
  onChange: (value: string) => void;
  /** Enter: updates the URL without waiting for the typing delay. */
  onSubmit: (value: string) => void;
  onClear: () => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <search className={className}>
      <Form
        method="get"
        action="/courses"
        onSubmit={(event) => {
          // Once hydrated, the URL is written by the same hook as the typing, which also drops an empty `q` and resets
          // the page. Before that, the browser's own GET does the job.
          event.preventDefault();
          onSubmit(value);
        }}
      >
        <label htmlFor="catalogue-search" className="sr-only">
          جست‌وجوی دوره
        </label>
        <InputGroup className="h-14 rounded-full">
          <InputGroupAddon>
            <SearchIcon strokeWidth={1.7} aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            id="catalogue-search"
            name="q"
            type="search"
            value={value}
            maxLength={MAX_QUERY_LENGTH}
            autoComplete="off"
            enterKeyHint="search"
            placeholder="مثلاً سگ همدم یا CGC"
            onChange={(event) => onChange(event.target.value)}
            // Our own clear button replaces the browser's cross.
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
        {family && <input type="hidden" name="family" value={family} />}
      </Form>
    </search>
  );
}
