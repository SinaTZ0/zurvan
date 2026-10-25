import { m } from "~/paraglide/messages";
import { DOG_FORM_SECTIONS, type DogFormSection } from "~/routes/account_dog_form/sections";

const JUMP_LABELS: Record<DogFormSection, () => string> = {
  identity: () => m.account_dog_form_step_identity(),
  body: () => m.account_dog_form_step_body(),
  health: () => m.account_dog_form_step_health(),
  training: () => m.account_dog_form_step_training(),
};

/** The id of a plate's `section`, the jump list's target. */
export const plateAnchor = (section: DogFormSection) => `df-plate-${section}`;

/*===== Jump List =====*/
/**
 * The edit page's way round its four plates: a row of small pills, one per plate in order, that jump to it (plain
 * fragment links, so the browser scrolls and keyboard focus follows). The plates carry `scroll-mt` for the header.
 */
export function JumpList({ className }: { className?: string }) {
  return (
    <nav aria-label={m.account_dog_form_jump_label()} className={className}>
      <ol className="flex flex-wrap gap-2">
        {DOG_FORM_SECTIONS.map((section) => (
          <li key={section}>
            <a
              href={`#${plateAnchor(section)}`}
              className="inline-flex h-10 items-center rounded-full border border-foreground/20 bg-card px-4 text-sm font-bold text-muted-foreground transition-colors outline-none hover:border-primary/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {JUMP_LABELS[section]()}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
