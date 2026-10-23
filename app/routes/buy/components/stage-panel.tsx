import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";
import { SceneStage, type SceneSpec } from "~/routes/buy/components/scene-stage";
import { PLATE } from "~/routes/buy/plate";

/*===== Stage Panel =====*/
/**
 * A wide grained panel that is one message: the words and the one way on at the start, a little scene at the end (on
 * phones the scene is a band on top). Used where the page has no list to show: before a pick, the evaluation gate, no
 * dogs. The scene fills what would otherwise be the panel's empty half.
 *
 * `arrive` lifts it in after a pick (`answer-in`, keyed by the caller), staggered by `delay`; on load it is simply there.
 */
export function StagePanel({
  titleId,
  title,
  scene,
  arrive = false,
  delay = 0,
  className,
  children,
}: {
  titleId: string;
  title: React.ReactNode;
  scene: SceneSpec;
  arrive?: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={titleId}
      className={cn(PLATE, "grid overflow-hidden lg:grid-cols-12", arrive && "answer-in", className)}
      style={arrive ? ({ "--answer-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {/*===== Words =====*/}
      <div className="order-2 p-5 pt-2 sm:p-8 sm:pt-4 lg:order-1 lg:col-span-7 lg:flex lg:flex-col lg:justify-center lg:p-12">
        <h2 id={titleId} className={cn(DISPLAY_HEADING, "text-h2 text-balance")}>
          {title}
        </h2>
        {children}
      </div>

      {/*===== Scene =====*/}
      {/* English bubbles take two lines on phones (the chalk hand runs wide), so the sky is taller there. */}
      <SceneStage
        spec={scene}
        className="order-1 h-[13.5rem] sm:h-[15rem] lg:order-2 lg:col-span-5 lg:h-auto lg:min-h-[20rem] ltr:max-sm:h-[15rem]"
      />
    </section>
  );
}
