import { ArrowUpLeftIcon } from "lucide-react";

import { SOCIAL_ICONS } from "~/components/social-icons";

/*===== Profile Sign =====*/
/**
 * One of the center's profiles on another site, hung from the wall's coping by two cords: a dark plate that is a single
 * link (new tab). The cords reach up to whatever is above (the coping, or on phones the sign before it), so the parent
 * decides their length with `--cord` (the gap between signs, which is also the wall's top padding).
 *
 * A compact row (icon, words, arrow), so the plate is filled; from `md` three of them stand side by side.
 */
export function ProfileSign({
  profile,
}: {
  profile: { label: string; handle: string; href: string };
}) {
  const Icon = SOCIAL_ICONS[profile.href];

  return (
    <li className="ct-sign relative">
      {/*------ Cords ------*/}
      {/* A nail at the top of each, a knot at the bottom. They sit under the plate, so only the gap shows. */}
      {["start-[18%]", "end-[18%]"].map((side) => (
        <span
          key={side}
          aria-hidden
          className={`absolute bottom-full h-[var(--cord)] w-0.5 bg-foreground/45 ${side} before:absolute before:-top-1 before:-start-[3px] before:size-2 before:rounded-full before:bg-foreground/70`}
        />
      ))}

      {/*------ Plate ------*/}
      <a
        href={profile.href}
        target="_blank"
        rel="noreferrer"
        className="group relative flex items-center gap-4 rounded-3xl border border-border bg-jet paper-grain p-5 shadow-[0_18px_36px_-18px_rgb(0_0_0/0.9)] transition-colors outline-none hover:border-primary/60 focus-visible:ring-3 focus-visible:ring-ring/60 md:p-6"
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-full border border-primary/60 text-primary">
          <Icon className="size-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl font-extrabold text-foreground md:text-2xl">{profile.label}</span>
          <span className="mt-1 block truncate text-sm text-muted-foreground">
            <bdi dir="ltr">{profile.handle}</bdi>
          </span>
        </span>
        <ArrowUpLeftIcon
          aria-hidden
          strokeWidth={1.8}
          className="size-5 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5"
        />
        <span className="sr-only">(در پنجره‌ی تازه باز می‌شود)</span>
      </a>
    </li>
  );
}
