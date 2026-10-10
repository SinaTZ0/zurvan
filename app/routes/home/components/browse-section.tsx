import { cn } from "cn";
import { ChevronLeftIcon } from "lucide-react";
import { useState } from "react";

import { Link } from "~/components/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { formatDayMonth } from "~/routes/home/format";
import { type Problem, PROBLEMS } from "~/routes/home/problems";

type Species = Problem["species"];

const SPECIES_TABS: { value: Species; label: string }[] = [
  { value: "dog", label: "سگ" },
  { value: "cat", label: "گربه" },
];

/*===== Browse Section =====*/
/**
 * Browsing by problem, in the owner's words, instead of by catalogue category: "قلاده را می‌کشد" leads to the leash
 * course. On desktop a photo of the course beside the list follows the row under the pointer or focus, so moving
 * through the list previews each course without leaving it.
 */
export function BrowseSection() {
  const [species, setSpecies] = useState<Species>("dog");
  const problems = PROBLEMS.filter((problem) => problem.species === species);
  const [activeId, setActiveId] = useState(problems[0]!.id);
  const active = problems.find((problem) => problem.id === activeId) ?? problems[0]!;

  return (
    <section aria-labelledby="browse-title" className="site-container pt-section-md">
      <Tabs
        value={species}
        onValueChange={(value: Species) => {
          setSpecies(value);
          setActiveId(PROBLEMS.find((problem) => problem.species === value)!.id);
        }}
        className="gap-0"
      >
        {/*------ Heading ------*/}
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="max-w-2xl">
            <h2 id="browse-title" className="text-h2 text-balance">
              حیوانت چه کاری می‌کند؟
            </h2>
            <p className="mt-2 text-pretty text-muted-foreground">
              کاری را که می‌خواهی تغییر کند پیدا کن. دوره‌ای که برایش ساخته شده و نزدیک‌ترین کلاسش را نشانت می‌دهیم.
            </p>
          </div>
          <TabsList className="group-data-horizontal/tabs:h-11 [&>button]:px-6 [&>button]:text-sm [&>button]:font-bold">
            {SPECIES_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-8 grid gap-gutter lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16">
          {/*------ Index ------*/}
          {SPECIES_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <ul className="border-t">
                {PROBLEMS.filter((problem) => problem.species === tab.value).map((problem) => (
                  <ProblemRow
                    key={problem.id}
                    problem={problem}
                    isActive={problem.id === active.id}
                    onActivate={() => setActiveId(problem.id)}
                  />
                ))}
              </ul>
            </TabsContent>
          ))}

          {/*------ Preview ------*/}
          <CoursePreview problems={problems} active={active} />
        </div>
      </Tabs>
    </section>
  );
}

/*===== Problem Row =====*/
function ProblemRow({
  problem,
  isActive,
  onActivate,
}: {
  problem: Problem;
  isActive: boolean;
  onActivate: () => void;
}) {
  return (
    <li className="border-b">
      <Link
        to={`/courses/${problem.course.slug}`}
        onPointerEnter={onActivate}
        onFocus={onActivate}
        className="group/row flex items-center gap-4 py-5 outline-none focus-visible:bg-accent sm:gap-6 lg:py-6"
      >
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-h3 leading-snug transition-colors",
              // Desktop marks the row the preview shows; phones have no preview, so nothing to mark.
              isActive && "lg:text-primary",
            )}
          >
            {problem.title}
          </span>
          <span className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
            <span>دوره‌ی {problem.course.title}</span>
            <span>کلاس بعدی {formatDayMonth(problem.nextRun.startsAt)}</span>
          </span>
        </span>

        {/* Phones get a thumbnail in place of the desktop preview. */}
        <img
          src={problem.course.photo}
          alt=""
          width={960}
          height={540}
          loading="lazy"
          className="size-16 shrink-0 rounded-xl object-cover lg:hidden"
        />
        <ChevronLeftIcon
          strokeWidth={1.7}
          aria-hidden
          className={cn(
            "hidden size-6 shrink-0 transition duration-300 motion-safe:group-hover/row:-translate-x-1 lg:block",
            isActive ? "text-primary" : "text-faint",
          )}
        />
      </Link>
    </li>
  );
}

/*===== Course Preview =====*/
/**
 * Desktop-only photo of the active row's course. Every photo is stacked and only the active one is opaque, so
 * switching rows cross-fades instead of waiting for an image to load.
 */
function CoursePreview({ problems, active }: { problems: Problem[]; active: Problem }) {
  return (
    <figure aria-hidden className="sticky top-8 hidden self-start lg:block">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-muted shadow-md">
        {problems.map((problem) => (
          <img
            key={problem.id}
            src={problem.course.photo}
            alt=""
            width={960}
            height={540}
            loading="lazy"
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-500",
              problem.id === active.id ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>
      <figcaption className="mt-4 flex items-baseline justify-between gap-4">
        <span className="font-extrabold">{active.course.title}</span>
        <span className="shrink-0 text-sm text-muted-foreground">با {active.course.trainer}</span>
      </figcaption>
    </figure>
  );
}
