// Declares the `<altcha-widget>` JSX element.
/// <reference types="altcha/types/react" />
import { useQuery } from "@tanstack/react-query";
import type { AltchaWidgetElement } from "altcha/types/generic";
import { cn } from "cn";
import { CheckIcon, CircleAlertIcon, ShieldCheckIcon } from "lucide-react";
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import { Spinner } from "~/components/ui/spinner";
import { orpc } from "~/orpc/client";

/*===== Types =====*/
type AltchaStateDetail = { state: string; payload?: string };

// States reported by the Altcha widget, plus "loading" (derived) while the script or challenge loads.
type WidgetState = "unverified" | "verifying" | "verified" | "error";
type CheckState = WidgetState | "loading";

export type AltchaWidgetHandle = {
  /** Discards the current solution and fetches a fresh challenge (e.g. after a failed submit). */
  reset: () => void;
};

type AltchaWidgetProps = {
  ref?: React.Ref<AltchaWidgetHandle>;
  /** Receives the solved payload, or `null` whenever the check is not (or no longer) verified. */
  onPayloadChange: (payload: string | null) => void;
  invalid?: boolean;
};

const LABELS: Record<CheckState, string> = {
  loading: "در حال آماده‌سازی…",
  unverified: "من ربات نیستم",
  verifying: "در حال بررسی…",
  verified: "تأیید شد!",
  error: "تأیید انجام نشد. دوباره بزنید.",
};

/*===== Component =====*/
/**
 * Human check for the sign-up form, styled like a Cloudflare Turnstile panel.
 *
 * Altcha runs invisibly underneath: it solves the proof-of-work in Web Workers when the user clicks
 * the checkbox, and this component draws the checkbox, progress, and result. The web component
 * touches `customElements`, so it is imported only in the browser. Challenges come from the
 * `captcha.createChallenge` procedure, so they go through the typed client like every API call.
 */
export function AltchaWidget({ ref, onPayloadChange, invalid = false }: AltchaWidgetProps) {
  const widgetRef = useRef<AltchaWidgetElement>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [widgetState, setWidgetState] = useState<WidgetState>("unverified");

  // Challenges are single-use: drop them from the cache on unmount, and only replace one when it
  // expires or a submit consumed it (both refetch explicitly), never on remount or focus.
  const challengeQuery = useQuery({
    ...orpc.captcha.createChallenge.queryOptions(),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  const { data: challenge, refetch } = challengeQuery;

  /*------ Load Script ------*/
  useEffect(() => {
    let cancelled = false;
    void import("altcha").then(() => {
      if (!cancelled) setIsScriptReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /*------ Apply Challenge ------*/
  useEffect(() => {
    const widget = widgetRef.current;
    if (!isScriptReady || !widget || !challenge) return;

    // `invisible` hides Altcha's own UI; `auto: "off"` waits for the checkbox click. `reset()`
    // reports "unverified" through the state listener below.
    void widget.configure({ challenge, display: "invisible", auto: "off" });
    widget.reset();
  }, [isScriptReady, challenge]);

  /*------ Follow Widget State ------*/
  useEffect(() => {
    const widget = widgetRef.current;
    if (!isScriptReady || !widget) return;

    const handleStateChange = (event: Event) => {
      const { state, payload } = (event as CustomEvent<AltchaStateDetail>).detail;
      onPayloadChange(state === "verified" && payload ? payload : null);

      if (state === "verifying" || state === "verified" || state === "error") setWidgetState(state);
      else setWidgetState("unverified");

      // An expired challenge can't be solved again; swap in a new one so the checkbox keeps working.
      if (state === "expired") void refetch();
    };

    widget.addEventListener("statechange", handleStateChange);
    return () => widget.removeEventListener("statechange", handleStateChange);
  }, [isScriptReady, onPayloadChange, refetch]);

  /*------ External Reset ------*/
  // The new challenge shows "loading" while it's fetched, then resets the widget when it arrives.
  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        onPayloadChange(null);
        void refetch();
      },
    }),
    [onPayloadChange, refetch],
  );

  /*------ Display State ------*/
  const isLoading = !isScriptReady || !challenge || challengeQuery.isFetching;
  const displayState: CheckState = challengeQuery.isError ? "error" : isLoading ? "loading" : widgetState;
  const isInteractive = displayState === "unverified" || displayState === "error";

  /*------ Actions ------*/
  const handleCheck = useCallback(() => {
    const widget = widgetRef.current;
    if (!widget) return;

    if (challengeQuery.isError) {
      void refetch();
      return;
    }
    if (displayState === "error") widget.reset();
    if (isInteractive) void widget.verify();
  }, [challengeQuery.isError, displayState, isInteractive, refetch]);

  return (
    <div
      className={cn(
        "flex h-16 items-center justify-between gap-3 rounded-lg border bg-muted/50 ps-2 pe-4 transition-colors",
        invalid ? "border-destructive" : "border-border",
        displayState === "verified" && "border-success/30 bg-success/10",
      )}
    >
      {/*------ Checkbox ------*/}
      {/* A native checkbox (visually hidden) keeps keyboard and screen-reader behavior; it stays
          unchecked until the proof-of-work is solved, so a click only starts verification. */}
      <label
        className={cn(
          "group flex h-12 min-w-0 items-center gap-3 rounded-md px-2 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
          isInteractive ? "cursor-pointer" : "cursor-default",
        )}
      >
        <input
          type="checkbox"
          checked={displayState === "verified"}
          onChange={handleCheck}
          aria-invalid={invalid}
          className="sr-only"
        />
        <span className="flex size-8 shrink-0 items-center justify-center">
          <CheckIndicator state={displayState} />
        </span>
        <span
          className={cn(
            "truncate text-sm font-bold",
            displayState === "verified" && "text-success",
            displayState === "error" && "text-destructive",
          )}
        >
          {LABELS[displayState]}
        </span>
      </label>

      {/*------ Brand ------*/}
      <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
        <div className="flex flex-col items-end leading-tight">
          <span dir="ltr" className="text-xs font-extrabold tracking-wider text-foreground/80">
            ALTCHA
          </span>
          <span className="text-xs">بدون کوکی و ردیابی</span>
        </div>
        <ShieldCheckIcon className="size-7 text-primary" strokeWidth={1.7} aria-hidden />
      </div>

      {/* Announces progress and the result; a label's text change alone isn't re-read. */}
      <span className="sr-only" aria-live="polite">
        {displayState === "unverified" || displayState === "loading" ? "" : LABELS[displayState]}
      </span>

      {/* Solver only: renders no UI in `invisible` mode. */}
      <altcha-widget ref={widgetRef} name="altcha" className="hidden" suppressHydrationWarning />
    </div>
  );
}

/*===== Indicator =====*/
/** The square on the start side: empty box, spinner, green check, or error mark. */
function CheckIndicator({ state }: { state: CheckState }) {
  switch (state) {
    case "loading":
    case "verifying":
      return <Spinner className="size-7 text-primary" />;
    case "verified":
      return (
        <span className="flex size-7 animate-in items-center justify-center rounded-full bg-success text-primary-foreground duration-300 zoom-in-50 motion-reduce:animate-none">
          <CheckIcon className="size-4" strokeWidth={3} aria-hidden />
        </span>
      );
    case "error":
      return <CircleAlertIcon className="size-7 text-destructive" strokeWidth={1.7} aria-hidden />;
    case "unverified":
      return (
        <span className="size-7 rounded-sm border-2 border-input bg-card transition-colors group-hover:border-primary" />
      );
  }
}
