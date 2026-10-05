import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "~/components/ui/alert";

/*===== Form Alert =====*/
/**
 * Form-level error message, for failures that don't belong to a single field (wrong credentials,
 * network errors, server errors). Renders nothing without a message. `role="alert"` announces it.
 */
export function FormAlert({ message }: { message: string | undefined }) {
  if (!message) return null;

  return (
    <Alert variant="destructive" className="border-destructive/30 px-3 py-2.5">
      <CircleAlertIcon strokeWidth={1.7} />
      <AlertDescription className="text-destructive">{message}</AlertDescription>
    </Alert>
  );
}
