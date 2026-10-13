/*===== Page Header =====*/
/**
 * The page's heading: the `h1` and one muted line saying what can be changed here. The line differs by role because a
 * partner has a second card (the Sheba) that a customer doesn't.
 */
export function PageHeader({ isPartner }: { isPartner: boolean }) {
  return (
    <header>
      <h1 className="font-display text-h1 font-black text-balance">تنظیمات حساب</h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        {isPartner ? "اسمت و شبای واریز کمیسیونت را همین‌جا درست کن." : "اسمت را همین‌جا درست کن."}
      </p>
    </header>
  );
}
