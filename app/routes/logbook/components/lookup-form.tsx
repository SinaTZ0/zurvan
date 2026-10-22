import { useNavigate, useRouterState } from "@tanstack/react-router";
import { CircleAlertIcon, Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { normalizeFileNumber } from "~/lib/dog-file";
import { m } from "~/paraglide/messages";

/*===== Lookup Form =====*/
/**
 * The plate with the file-number form. The number is checked for its shape only; what the record shows is decided by
 * the record (it is private unless its owner says otherwise).
 *
 * Motion (off for reduced motion, which shows the finished plate): on load the plate rises in (`lb-rise`); a number
 * with the wrong shape gives the input one short shake and the error line rises in; typing folds the line away, not by
 * unmounting it but by closing its grid row, so the plate doesn't jump; while the record loads the button's label and a
 * spinner turn into each other.
 */
export function LookupForm() {
  const navigate = useNavigate();
  const pending = useRouterState({ select: (state) => state.status === "pending" });

  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  // The message and the counter outlive `invalid`, so the line keeps its words while it folds away, and a second
  // wrong number remounts the line (`key`), which plays its arrival again and has screen readers announce it again.
  const [attempt, setAttempt] = useState(0);
  const shakeRef = useRef<HTMLDivElement>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const fileNumber = normalizeFileNumber(value);
    if (!fileNumber) {
      setInvalid(true);
      setAttempt((count) => count + 1);

      // Replay the shake without remounting the input (it would lose focus): drop the class, force a reflow, add it.
      const box = shakeRef.current;
      if (box) {
        box.classList.remove("lb-shake");
        void box.offsetWidth;
        box.classList.add("lb-shake");
      }
      return;
    }
    void navigate({ to: "/logbook/{-$fileNumber}", params: { fileNumber } });
  }

  return (
    <form
      method="get"
      onSubmit={onSubmit}
      noValidate
      className="lb-rise relative mt-8 flex w-full max-w-[28rem] flex-col gap-5 rounded-4xl border border-border bg-card paper-grain p-6 shadow-[0_24px_50px_-24px_rgb(0_0_0/0.9)] md:p-8"
    >
      <Field data-invalid={invalid}>
        <FieldLabel htmlFor="logbook-file-number">{m.logbook_form_label()}</FieldLabel>
        <div ref={shakeRef}>
          <Input
            id="logbook-file-number"
            dir="ltr"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="ZD-4F9A21C07B"
            aria-invalid={invalid}
            aria-describedby={invalid ? "logbook-file-number-error" : undefined}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setInvalid(false);
            }}
            className="text-start font-mono text-lg tracking-wider"
          />
        </div>
        <FieldDescription>{m.logbook_form_hint()}</FieldDescription>

        {/*------ Error line ------*/}
        {/* Always mounted: the grid row opens from 0fr and closes back, `inert` while closed so it can't be reached. */}
        <div
          aria-live="assertive"
          inert={!invalid}
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${invalid ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <div className="overflow-hidden">
            {attempt > 0 && (
              <p
                key={attempt}
                id="logbook-file-number-error"
                className="answer-in flex items-start gap-2 text-sm text-destructive"
              >
                <CircleAlertIcon aria-hidden strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
                <span className="text-pretty">
                  {m.logbook_form_error_before()}{" "}
                  <bdi dir="ltr" className="whitespace-nowrap">
                    ZD-4F9A21C07B
                  </bdi>
                  {m.logbook_form_error_after()}
                </span>
              </p>
            )}
          </div>
        </div>
      </Field>

      {/*------ Button ------*/}
      {/* Label and spinner share one grid cell and turn into each other while the record loads. */}
      <Button
        type="submit"
        variant="solid"
        size="lg"
        aria-busy={pending}
        className="w-full disabled:opacity-100 sm:w-auto sm:self-start sm:px-10"
        disabled={pending}
      >
        <span className="grid place-items-center">
          <span
            className={`col-start-1 row-start-1 transition duration-200 motion-reduce:transition-none ${pending ? "scale-50 -rotate-90 opacity-0" : ""}`}
          >
            {m.logbook_form_submit()}
          </span>
          <Loader2Icon
            aria-hidden
            strokeWidth={2.2}
            className={`col-start-1 row-start-1 size-5 transition duration-200 motion-safe:animate-spin motion-reduce:transition-none ${pending ? "" : "scale-50 opacity-0"}`}
          />
        </span>
      </Button>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .lb-rise { animation: lb-rise .6s cubic-bezier(.2,.8,.2,1) .1s both; }
          .lb-shake { animation: lb-shake .4s ease-in-out both; }
        }
        @keyframes lb-rise {
          from { opacity: 0; transform: translateY(1.75rem); }
          to { opacity: 1; transform: none; }
        }
        @keyframes lb-shake {
          0%, 100% { transform: none; }
          18% { transform: translateX(-7px); }
          36% { transform: translateX(6px); }
          54% { transform: translateX(-4px); }
          72% { transform: translateX(3px); }
          88% { transform: translateX(-1px); }
        }
      `}</style>
    </form>
  );
}
