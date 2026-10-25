import type { SVGProps } from "react";

import { CENTER_INSTAGRAM, CENTER_TELEGRAM, CENTER_WHATSAPP } from "~/lib/contact";

/*===== Social Icons =====*/
// Lucide dropped its brand icons, so these are drawn here in its manner (24-unit box, round stroke in currentColor),
// so they sit with the page's other line icons.
function Glyph({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Glyph {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.2 6.8h.01" strokeWidth={2.6} />
    </Glyph>
  );
}

/** WhatsApp's speech bubble with its tail at the bottom left, and the handset inside it. */
function WhatsappIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Glyph {...props}>
      <path d="M3.5 20.5 4.8 16A8.6 8.6 0 1 1 8 19.2z" />
      <path d="M9 8.6c0 3.3 3 6.4 6.4 6.4l1.1-1.4-1.8-1-1 .9a4.4 4.4 0 0 1-2.2-2.2l.9-1-1-1.8z" strokeWidth={1.4} />
    </Glyph>
  );
}

/** Telegram's paper plane: the wing, and the fold that runs from the nose back to the tail. */
function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Glyph {...props}>
      <path d="M21.2 4.2 2.9 11.3c-.7.3-.7 1.2 0 1.4l4.6 1.5 1.8 5.5c.2.6 1 .8 1.4.3l2.6-2.4 4.6 3.4c.6.4 1.4.1 1.5-.6l3-15c.2-.8-.5-1.4-1.2-1.2z" />
      <path d="m7.5 14.2 9.8-6.4-6.6 7.4-.6 4.3" />
    </Glyph>
  );
}

/** The icon for each of the center's profiles in `CENTER_LINKS`, looked up by its address. */
export const SOCIAL_ICONS: Record<string, (props: SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  [CENTER_INSTAGRAM.href]: InstagramIcon,
  [CENTER_WHATSAPP.href]: WhatsappIcon,
  [CENTER_TELEGRAM.href]: TelegramIcon,
};
