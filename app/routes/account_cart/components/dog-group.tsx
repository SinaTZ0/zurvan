import { DogPhoto } from "~/components/dog-photo";
import { DogThumb } from "~/components/dog-thumb";
import { SpeechBubble } from "~/components/speech-bubble";
import type { ReviewedItem } from "~/orpc/checkout/contract";
import { getGroupLine, type DogGroup } from "~/routes/account_cart/cart-groups";
import { CartItemRow } from "~/routes/account_cart/components/cart-item-row";

/*===== Dog Group =====*/
/**
 * One dog's bag: the dog, what it says about what it's about to start, and its items.
 *
 * Desktop is a row like the Dashboard's dog card: the photo at the start, the bubble on top of the words with its tail
 * back at the photo. Phones swap the photo for a 64px thumb beside the name, with the bubble under it and its tail up
 * at the thumb. The photo box is hidden, not just shrunk, so a phone loads one dog image at most: the thumb.
 */
export function DogGroupCard({ group, onRemove }: { group: DogGroup; onRemove: (item: ReviewedItem) => void }) {
  const { dog } = group;
  const titleId = `cart-dog-${dog.id}`;

  return (
    <article
      aria-labelledby={titleId}
      className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:p-6"
    >
      {/*------ Photo (desktop) ------*/}
      {/* At least 224px tall: the no-photo tag is 192px, so no shorter box would clip it. */}
      <div className="max-lg:hidden lg:col-span-4 lg:self-start">
        <DogPhoto name={dog.name} photo={dog.photo} className="aspect-[4/3] min-h-56 w-full rounded-2xl" />
      </div>

      <div className="flex min-w-0 flex-col lg:col-span-8">
        {/*------ Name ------*/}
        <div className="flex items-center gap-3 lg:order-2">
          <DogThumb name={dog.name} photo={dog.photo} className="size-16 lg:hidden" />
          <h2 id={titleId} className="text-2xl font-extrabold text-balance">
            <bdi>{dog.name}</bdi>
          </h2>
        </div>

        {/*------ Bubble ------*/}
        <SpeechBubble
          tail="top-start"
          lgTail="bottom-start"
          className="ms-1 mt-4 max-w-[calc(100%-0.25rem)] self-start sm:max-w-sm lg:order-1 lg:ms-0 lg:mt-0 lg:mb-10 lg:max-w-md"
        >
          {getGroupLine(group)}
        </SpeechBubble>

        {/*------ Items ------*/}
        <ul className="mt-4 flex flex-col gap-3 lg:order-3 lg:mt-5">
          {group.items.map((item) => (
            <CartItemRow key={`${item.courseSlug}|${item.dogId}`} item={item} onRemove={onRemove} />
          ))}
        </ul>
      </div>
    </article>
  );
}
