import { useState } from "react";
import { useNavigate } from "react-router";

import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { logbookPath, normalizeFileNumber } from "~/lib/dog-file";

/*===== Lookup Form =====*/
/**
 * «پرونده‌ی سگ»: type the file number from a QR code or a certificate. The number is checked for its shape only; what the
 * record shows is decided by the record (it is private unless its owner says otherwise).
 */
export function LookupForm() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fileNumber = normalizeFileNumber(value);
    if (!fileNumber) {
      setError("شماره‌ی پرونده درست نیست؛ شکلش مثل ZD-4F9A21C07B است.");
      return;
    }
    void navigate(logbookPath(fileNumber));
  }

  return (
    <div className="max-w-xl">
      <h1 id="logbook-title" className="font-display text-h1 font-black text-balance">
        پرونده‌ی سگ
      </h1>
      <p className="mt-4 text-lead text-pretty text-muted-foreground">
        شماره‌ی پرونده روی QR یا گواهی سگ نوشته شده. اینجا بنویسش.
      </p>

      <form method="get" onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <Field data-invalid={error !== null}>
          <FieldLabel htmlFor="logbook-file-number">شماره‌ی پرونده</FieldLabel>
          <Input
            id="logbook-file-number"
            dir="ltr"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="ZD-4F9A21C07B"
            aria-invalid={error !== null}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
            className="text-start font-mono text-lg tracking-wider"
          />
          <FieldDescription>با یا بدون «ZD-»، با حروف بزرگ یا کوچک.</FieldDescription>
          {error && <FieldError errors={[{ message: error }]} />}
        </Field>
        <Button type="submit" size="lg" className="w-full sm:w-auto sm:self-start">
          باز کن
        </Button>
      </form>
    </div>
  );
}
