import { ArrowRightIcon, PencilIcon } from "lucide-react";

import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { describeDog } from "~/lib/dog-format";
import type { AdminDog } from "~/orpc/dog/contract";
import { ADMIN_DOGS_PATH } from "~/routes/admin_dog_detail/search-params";
import { INK_OUTLINE } from "~/routes/admin_dog_detail/surfaces";

/*===== Dog Header =====*/
/**
 * The way back to the Dogs list, then the page's `h1` (the dog's name) over its facts and breed, and the one action
 * of the header: «ویرایش مشخصات», which opens the edit sheet. On phones the button goes under the title, full width.
 */
export function DogHeader({ dog, onEdit }: { dog: AdminDog; onEdit: () => void }) {
  return (
    <div>
      {/* In RTL the start side is the right, so «back» points right. */}
      <Link
        to={ADMIN_DOGS_PATH}
        className="-ms-1 mb-2 inline-flex h-10 items-center gap-1.5 rounded-full ps-1 pe-3 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`${INK_OUTLINE} px-4 max-sm:h-11 max-sm:w-full`}
          onClick={onEdit}
        >
          <PencilIcon aria-hidden />
          ویرایش مشخصات
        </Button>
      </AdminPageHeader>
    </div>
  );
}
