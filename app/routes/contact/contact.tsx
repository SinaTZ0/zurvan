import { CameraIcon, PhoneIcon, SendIcon, VideoIcon } from "lucide-react";

import { Link } from "~/components/link";
import { CENTER_INSTAGRAM, CENTER_PHONE, CENTER_SERVICE_AREA, CENTER_TELEGRAM, CENTER_YOUTUBE } from "~/lib/contact";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { ContactCard } from "~/routes/contact/components/contact-card";

import type { Route } from "./+types/contact";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "تماس با ما | زروان" },
  {
    name: "description",
    content: `تلفن، تلگرام، اینستاگرام و یوتیوب ${HEAD_TRAINER.name}؛ فعال در ${CENTER_SERVICE_AREA}.`,
  },
];

/*===== Page =====*/
// Static: no loader. Only the details the owner printed on the business card. A second phone number and a WhatsApp link
// are still unconfirmed, so they are not here (and are never guessed): see `app/lib/contact.ts`.
export default function ContactPage() {
  return (
    <section aria-labelledby="contact-title" className="site-container pt-section-sm pb-section-md">
      <h1 id="contact-title" className="font-display text-h1 font-black text-balance">
        تماس با ما
      </h1>
      <p className="mt-4 max-w-xl text-lead text-pretty text-muted-foreground">
        مستقیم با {HEAD_TRAINER.firstName} حرف بزن؛ تلفن یا پیام، هر کدوم برات راحت‌تره.
      </p>

      {/*===== Ways to Reach =====*/}
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <li>
          <ContactCard
            icon={PhoneIcon}
            label="تماس تلفنی"
            value={<span dir="ltr">{CENTER_PHONE.display}</span>}
            href={`tel:${CENTER_PHONE.tel}`}
          />
        </li>
        <li>
          <ContactCard
            icon={SendIcon}
            label={CENTER_TELEGRAM.label}
            value={<bdi>{CENTER_TELEGRAM.handle}</bdi>}
            href={CENTER_TELEGRAM.href}
            external
          />
        </li>
        <li>
          <ContactCard
            icon={CameraIcon}
            label={CENTER_INSTAGRAM.label}
            value={<bdi>{CENTER_INSTAGRAM.handle}</bdi>}
            href={CENTER_INSTAGRAM.href}
            external
          />
        </li>
        <li>
          <ContactCard
            icon={VideoIcon}
            label={CENTER_YOUTUBE.label}
            value={<bdi>{CENTER_YOUTUBE.handle}</bdi>}
            href={CENTER_YOUTUBE.href}
            external
          />
        </li>
      </ul>

      {/*===== Area and Help =====*/}
      <p className="mt-10 font-bold">محدوده‌ی فعالیت: {CENTER_SERVICE_AREA}</p>
      <p className="mt-2 text-pretty text-muted-foreground">
        جواب خیلی از سؤال‌ها توی{" "}
        <Link to="/help" className="font-bold text-primary underline underline-offset-4">
          سؤال‌های پرتکرار
        </Link>{" "}
        هست.
      </p>
    </section>
  );
}
