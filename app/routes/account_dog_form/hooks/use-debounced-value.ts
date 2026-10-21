import { useEffect, useState } from "react";

/*===== Debounced Value =====*/
/**
 * `value` once it has stopped changing for `delay` ms. The print's «منم {name}!» bubble re-pops on the debounced name,
 * so it answers a finished word instead of every keystroke.
 */
export function useDebouncedValue<T>({ value, delay }: { value: T; delay: number }): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
