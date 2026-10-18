import { LockKeyholeIcon } from "lucide-react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";

/*===== Private Record =====*/
/**
 * What a stranger sees at a dog's record: that it is private, and nothing else. The same words for a record that is
 * private, one that doesn't exist and a number that isn't one, so the page can't be used to find out which numbers are
 * real. The owner's way in is signing in; the Admin's is the same.
 */
export function PrivateRecord({ signInPath }: { signInPath: string | null }) {
  return (
    <div className="max-w-xl">
      <LockKeyholeIcon aria-hidden strokeWidth={1.5} className="size-10 text-primary" />
      <h1 id="logbook-title" className="mt-4 font-display text-h1 font-black text-balance">
        این پرونده خصوصیه
      </h1>
      <p className="mt-4 text-lead text-pretty text-muted-foreground">
        چیزی از پرونده‌ی یه سگ بدون اجازه‌ی صاحبش نشون داده نمی‌شه.
      </p>
      <p className="mt-3 text-pretty text-muted-foreground">اگه صاحب سگی، وارد شو تا پرونده‌ی خودت رو ببینی.</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {signInPath && (
          <Link to={signInPath} className={buttonVariants({ size: "lg" })}>
            ورود
          </Link>
        )}
        <Link to="/logbook" className={buttonVariants({ variant: "outline", size: "lg" })}>
          شماره‌ی دیگری بنویس
        </Link>
      </div>
    </div>
  );
}
