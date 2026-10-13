/*===== Sign-in Code Section =====*/
/** How the sign-in code works and what limits it: the waiting time, the five-try lock and the per-number and per-IP cap. */
export function SignInCode() {
  return (
    <section id="sign-in-code" aria-labelledby="sign-in-code-title" className="scroll-mt-24">
      <h2 id="sign-in-code-title" className="font-display text-h2 font-black text-balance">
        کد پیامکی
      </h2>
      <p className="mt-6 max-w-prose text-pretty text-muted-foreground">
        برای ورود، یه کد پنج‌رقمی به شماره‌ات پیامک می‌شه. کد دو دقیقه اعتبار داره و برای کد تازه باید ۶۰ ثانیه صبر کنی.
        بعد از پنج بار اشتباه، اون کد باطل می‌شه. درخواست پشت‌سرهم‌ی کد برای هر شماره و هر نشانی IP محدوده.
      </p>
    </section>
  );
}
