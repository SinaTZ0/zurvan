import { useState } from "react";
import { useNavigate, useNavigation } from "react-router";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { certificatePath } from "~/lib/certificate";
import { numberToCheck } from "~/routes/certificate/retry-number";

/*===== Retry Form =====*/
/**
 * The unknown state's small form on a grained plate: type the number again and check it. It only navigates to
 * `/certificate/<typed>`, where the loader answers (any text gets an answer, so there is no shape check and no error
 * line of its own). While the next verdict loads the button's label and a spinner turn into each other in one grid
 * cell, and the input is read-only so the number can't change under the request.
 */
export function RetryForm() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [typed, setTyped] = useState("");
  const pending = navigation.state !== "idle" && navigation.location?.pathname.startsWith("/certificate/") === true;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const number = numberToCheck(typed);
    if (!number || pending) return;
    void navigate(certificatePath(number));
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-busy={pending}
      className="mt-7 max-w-md rounded-4xl border border-foreground/10 bg-card paper-grain p-5 shadow-[0_24px_50px_-24px_rgb(0_0_0/0.9)] sm:p-6"
    >
      <label htmlFor="certificate-number" className="mb-2 block text-sm font-bold">
        شماره‌ی گواهی
      </label>
      <Input
        id="certificate-number"
        dir="ltr"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="ZC-4F9A21C07B"
        value={typed}
        readOnly={pending}
        onChange={(event) => setTyped(event.target.value)}
        className="text-start font-mono text-lg tracking-wider uppercase placeholder:normal-case md:text-lg"
      />

      <Button type="submit" size="lg" variant="solid" className="mt-4 w-full">
        {/* Both stay mounted in one grid cell and cross-fade, so the button never changes width. */}
        <span className="grid place-items-center">
          <span
            className={`col-start-1 row-start-1 transition-all duration-200 ${pending ? "scale-90 opacity-0" : ""}`}
          >
            بررسی کن
          </span>
          <span
            aria-hidden={!pending}
            className={`col-start-1 row-start-1 transition-all duration-200 ${pending ? "" : "scale-50 opacity-0"}`}
          >
            <Spinner aria-label="در حال بررسی" />
          </span>
        </span>
      </Button>
    </form>
  );
}
