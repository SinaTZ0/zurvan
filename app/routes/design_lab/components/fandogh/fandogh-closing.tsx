import { Link } from "~/components/link";
import { CENTER_LINKS, CENTER_PHONE, CENTER_SERVICE_AREA } from "~/lib/contact";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { FandoghBubble } from "~/routes/design_lab/components/fandogh/fandogh-bubble";
import { LAB_LINKS } from "~/routes/design_lab/lab-content";

/*===== Closing CTA =====*/
/** Leaf green (the leash's colour): Fandogh lies there with the leash in his mouth, asking to go. */
export function FandoghClosing() {
  return (
    <section aria-labelledby="fd-closing-title" className="bg-[var(--fd-leaf)] py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 md:grid-cols-[auto_1fr] md:gap-14">
        <div className="mx-auto grid size-72 place-items-center rounded-full bg-white sm:size-80">
          <img
            src="/photo/design-lab/fandogh-3.webp"
            alt="فندق دراز کشیده و بند سبز را در دهان گرفته است"
            width={610}
            height={610}
            loading="lazy"
            className="size-full scale-105 mix-blend-multiply"
          />
        </div>
        <div>
          <FandoghBubble tail="bottom-start" className="max-w-md">
            بند را خودم آوردم! دیگر فقط تو مانده‌ای.
          </FandoghBubble>
          <h2 id="fd-closing-title" className="mt-8 font-['Lalezar'] text-5xl leading-snug text-white sm:text-6xl">
            برویم تمرین؟
          </h2>
          <p className="mt-3 max-w-lg text-lg leading-8 text-white">
            ارزیابی رایگان است و تعهدی ندارد. {HEAD_TRAINER.firstName} خودش تماس می‌گیرد.
          </p>
          <Link
            to={LAB_LINKS.evaluation}
            className="mt-8 inline-block rounded-full bg-white px-9 py-4 text-lg font-bold text-[var(--fd-ink)] outline-offset-4 transition-colors hover:bg-[var(--fd-ink)] hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            ارزیابی رایگان
          </Link>
        </div>
      </div>
    </section>
  );
}

/*===== Footer =====*/
export function FandoghFooter() {
  return (
    <footer className="bg-[var(--fd-ink)] pt-12 pb-24 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-['Lalezar'] text-3xl">زروان</p>
          <p className="mt-1 text-sm text-white/75">مجموعه تربیتی و رفتارشناسی سگ زروان</p>
          <p className="mt-4 text-sm text-white/75">{CENTER_SERVICE_AREA}</p>
        </div>
        <div>
          <p className="text-sm text-white/70">تماس</p>
          <a
            href={`tel:${CENTER_PHONE.tel}`}
            dir="ltr"
            className="mt-1 inline-block rounded-md text-2xl font-bold outline-offset-4 focus-visible:outline-2 focus-visible:outline-white"
          >
            {CENTER_PHONE.display}
          </a>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {CENTER_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md text-[var(--fd-sky)] underline underline-offset-4 outline-offset-4 focus-visible:outline-2 focus-visible:outline-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <ul className="flex flex-col gap-2 text-sm md:items-end">
          <li>
            <Link
              to="/privacy"
              className="rounded-md underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-white"
            >
              حریم خصوصی
            </Link>
          </li>
          <li>
            <Link
              to="/join/partner"
              className="rounded-md underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-white"
            >
              همکاری با زروان
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
