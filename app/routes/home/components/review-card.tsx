import { Stars } from "~/components/stars";
import type { Review } from "~/routes/home/reviews";

/*===== Review Card =====*/
/** One owner's review. A course review leads with the course and its stars; a comment is just the owner's words. */
export function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="rounded-2xl bg-card p-4 text-card-foreground shadow-lg sm:p-5">
      {/*------ Course ------*/}
      {review.kind === "course" && (
        <div className="mb-3 flex items-center gap-3 border-b pb-3">
          <img
            src={review.course.photo}
            alt=""
            width={96}
            height={96}
            loading="lazy"
            className="size-11 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{review.course.title}</p>
            <Stars rating={review.rating} />
          </div>
        </div>
      )}

      {/*------ Quote ------*/}
      <blockquote className="text-sm leading-7 text-pretty">{review.quote}</blockquote>

      {/*------ Author ------*/}
      <figcaption className="mt-3 flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-extrabold text-primary"
        >
          {review.author.charAt(0)}
        </span>
        <span className="min-w-0 text-xs leading-5">
          <span className="block font-extrabold">{review.author}</span>
          <span className="block text-muted-foreground">{review.pet}</span>
        </span>
      </figcaption>
    </figure>
  );
}
