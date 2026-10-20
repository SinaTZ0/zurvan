import { cn } from "cn";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

import { Link } from "~/components/link";
import { NavLink } from "~/components/nav-link";
import { DESIGNS, type DesignVariant } from "~/routes/design_lab/designs";

/*===== Design Switch =====*/
/**
 * The floating pill that moves between the designs and back to the live home page. Deliberately neutral (grey
 * glass, system type) so it never reads as part of any design. ←/→ step through the designs; in RTL the left arrow is
 * "next". Keys typed into a field are left alone.
 */
export function DesignSwitch({ current }: { current: DesignVariant }) {
  const navigate = useNavigate();
  const pill = useRef<HTMLDivElement>(null);

  /*------ Keep the current design in view ------*/
  // On a phone the pill is wider than the screen and scrolls sideways; bring the active link into it.
  useEffect(() => {
    pill.current
      ?.querySelector(`a[href="/design-lab/${current}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [current]);

  /*------ Arrow keys ------*/
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;

      const index = DESIGNS.findIndex((design) => design.variant === current);
      const step = event.key === "ArrowLeft" ? 1 : -1;
      const next = DESIGNS[(index + step + DESIGNS.length) % DESIGNS.length];
      navigate(`/design-lab/${next.variant}`);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, navigate]);

  return (
    <nav
      aria-label="طرح‌های پیشنهادی"
      className="fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4"
      style={{ fontFamily: "Vazirmatn Variable, system-ui, sans-serif" }}
    >
      <div
        ref={pill}
        className="flex max-w-full [scrollbar-width:none] items-center gap-1 overflow-x-auto rounded-full border border-white/15 bg-neutral-900/85 p-1 text-sm text-white shadow-lg backdrop-blur"
      >
        {DESIGNS.map((design, index) => (
          <NavLink
            key={design.variant}
            to={`/design-lab/${design.variant}`}
            title={design.kind}
            className={({ isActive }) =>
              cn(
                "rounded-full px-3 py-1.5 whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white",
                isActive ? "bg-white text-neutral-900" : "hover:bg-white/10",
              )
            }
          >
            {(index + 1).toLocaleString("fa-IR")}. {design.mascot}
          </NavLink>
        ))}
        <span aria-hidden className="mx-1 h-5 w-px bg-white/20" />
        <Link
          to="/"
          className="rounded-full px-3 py-1.5 whitespace-nowrap text-white/70 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white"
        >
          صفحه فعلی
        </Link>
      </div>
    </nav>
  );
}
