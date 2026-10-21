import { CENTER_SERVICE_AREA } from "~/lib/contact";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { AreaBand } from "~/routes/contact/components/area-band";
import { ContactHero } from "~/routes/contact/components/contact-hero";
import { MessagesWall } from "~/routes/contact/components/messages-wall";
import type { PublicLayoutHandle } from "~/routes/layout_public/layout-public";

import type { Route } from "./+types/contact";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "تماس با ما | زروان" },
  {
    name: "description",
    content: `تلفن، تلگرام، اینستاگرام و یوتیوب ${HEAD_TRAINER.name}؛ فعال در ${CENTER_SERVICE_AREA}.`,
  },
];

/*===== Handle =====*/
// The last band (the path under the Tehran skyline) runs into the footer, so the shell drops its bottom padding.
export const handle: PublicLayoutHandle = { flushFooter: true };

/*===== Page =====*/
// Static: no loader. Only the details the owner printed on the business card (`app/lib/contact.ts`). A second phone
// number and a WhatsApp link are still unconfirmed, so they are not here (and are never guessed).
export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <MessagesWall />
      <AreaBand />
    </>
  );
}
