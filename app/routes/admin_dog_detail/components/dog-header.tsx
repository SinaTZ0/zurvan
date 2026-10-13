import { ArrowRightIcon, PencilIcon } from "lucide-react";

import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { describeDog } from "~/lib/dog-format";
import type { AdminDog } from "~/orpc/dog/contract";
import { ADMIN_DOGS_PATH } from "~/routes/admin_dog_detail/search-params";

/*===== Dog Header =====*/
/**
 * The way back to the Dogs list, then the page's `h1` (the dog's name), its facts and breed, and the one action here:
 * «ویرایش مشخصات», which opens the edit sheet. Under the title on phones the button takes the full width.
 */
export function DogHeader({ dog, onEdit }: { dog: AdminDog; onEdit: () => void }) {
  return (
    <div>
      {/* In RTL the start side is the right, so «back» points right. */}
      <Link
        to={ADMIN_DOGS_PATH}
        className="mb-3 inline-flex h-10 items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <ArrowRightIcon aria-hidden className="size-4" />
        همه‌ی سگ‌ها
      </Link>

      <AdminPageHeader
        title={dog.name}
        summary={
          <>
            {describeDog(dog)}
            {dog.breed && (
              <>
                {" · "}
                <bdi>{dog.breed}</bdi>
              </>
            )}
          </>
        }
      >
        <Button type="button" variant="outline" size="sm" className="max-sm:w-full" onClick={onEdit}>
          <PencilIcon aria-hidden />
          ویرایش مشخصات
        </Button>
      </AdminPageHeader>
    </div>
  );
}
