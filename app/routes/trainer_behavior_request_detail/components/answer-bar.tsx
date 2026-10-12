import { Button } from "~/components/ui/button";

/*===== Answer Bar =====*/
function scrollToAnswer() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("answer")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

/**
 * Phones only: a fixed bottom bar with «برنامه بده», so the answer is one tap away from the case. It scrolls to the answer
 * card rather than submitting anything. It is outline, not gold, so the page keeps one gold-leaf action.
 */
export function AnswerBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-popover/95 pb-[env(safe-area-inset-bottom)] text-popover-foreground shadow-lg backdrop-blur-md lg:hidden">
      <div className="site-container py-3">
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={scrollToAnswer}>
          برنامه بده
        </Button>
      </div>
    </div>
  );
}
