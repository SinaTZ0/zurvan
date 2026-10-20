import { data, redirect } from "react-router";

import { DesignSwitch } from "~/routes/design_lab/components/design-switch";
import { FandoghHome } from "~/routes/design_lab/components/fandogh/fandogh-home";
import { RakhshHome } from "~/routes/design_lab/components/rakhsh/rakhsh-home";
import { SayeHome } from "~/routes/design_lab/components/saye/saye-home";
import { StoryHome } from "~/routes/design_lab/components/story/story-home";
import { StoryNightHome } from "~/routes/design_lab/components/story/story-night-home";
import { GOLD_STYLES, NIGHT_PALETTES } from "~/routes/design_lab/components/story/story-palettes";
import { StoryTeach } from "~/routes/design_lab/components/story/story-teach";
import { StoryTrail } from "~/routes/design_lab/components/story/story-trail";
import { isDesignVariant } from "~/routes/design_lab/designs";

import type { Route } from "./+types/design-lab";

/*===== Loader =====*/
// `/design-lab` opens the first design; an unknown number is a 404 rather than a silent fallback.
export function loader({ params }: Route.LoaderArgs) {
  if (params.variant === undefined) throw redirect("/design-lab/1");
  if (!isDesignVariant(params.variant)) throw data(null, { status: 404 });
  return { variant: params.variant };
}

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "آزمایشگاه طراحی | آموزش K9" },
  { name: "robots", content: "noindex, nofollow" },
];

/*===== Links =====*/
// Display faces only the lab uses, loaded here so the live site's bundle doesn't change.
export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Lalezar&family=Reem+Kufi:wght@400..700&display=swap",
  },
];

/*===== Page =====*/
export default function DesignLabPage({ loaderData }: Route.ComponentProps) {
  const { variant } = loaderData;

  return (
    <>
      {variant === "1" && <RakhshHome />}
      {variant === "2" && <FandoghHome />}
      {variant === "3" && <SayeHome />}
      {variant === "4" && <StoryHome />}
      {variant === "5" && <StoryNightHome palettes={NIGHT_PALETTES} />}
      {variant === "6" && <StoryNightHome palettes={GOLD_STYLES} />}
      {variant === "7" && (
        <StoryNightHome
          palettes={GOLD_STYLES.slice(0, 1)}
          Services={StoryTeach}
          Path={StoryTrail}
          ground
          typed
          lively
          fit
        />
      )}
      <DesignSwitch current={variant} />
    </>
  );
}
