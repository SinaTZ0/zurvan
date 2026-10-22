import { createFileRoute } from "@tanstack/react-router";

import { CENTER_SERVICE_AREA } from "~/lib/contact";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { AreaBand } from "~/routes/contact/components/area-band";
import { ContactHero } from "~/routes/contact/components/contact-hero";
import { MessagesWall } from "~/routes/contact/components/messages-wall";

/*===== Route =====*/
export const Route = createFileRoute("/_public/contact")({
  head: () => ({
    meta: [
      { title: "تماس با ما | زروان" },
      {
        name: "description",
        content: `تلفن، تلگرام، اینستاگرام و یوتیوب ${HEAD_TRAINER.name}؛ فعال در ${CENTER_SERVICE_AREA}.`,
      },
    ],
  }),
  // The last band (the path under the Tehran skyline) runs into the footer, so the shell drops its bottom padding.
  staticData: { flushFooter: true },
  component: ContactPage,
});

/*===== Page =====*/
// Static: no loader. Only the details the owner printed on the business card (`app/lib/contact.ts`). A second phone
// number and a WhatsApp link are still unconfirmed, so they are not here (and are never guessed).
function ContactPage() {
  return (
    <>
      <ContactHero />
      <MessagesWall />
      <AreaBand />
    </>
  );
}
