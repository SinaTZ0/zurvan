import { SearchIcon } from "lucide-react";
import { Form } from "react-router";

import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";

/*===== Site Search =====*/
/**
 * Course search. A plain GET form to the catalogue, so it works before hydration and the query lands in the URL
 * where the catalogue's filters live.
 */
export function SiteSearch({ className, id = "site-search" }: { className?: string; id?: string }) {
  return (
    <search className={className}>
      <Form method="get" action="/courses" viewTransition>
        <label htmlFor={id} className="sr-only">
          جست‌وجوی دوره
        </label>
        <InputGroup className="h-11 rounded-full">
          <InputGroupAddon>
            <SearchIcon strokeWidth={1.7} aria-hidden />
          </InputGroupAddon>
          <InputGroupInput id={id} name="q" type="search" placeholder="جست‌وجوی دوره" />
        </InputGroup>
      </Form>
    </search>
  );
}
