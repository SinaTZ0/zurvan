import { z } from "zod";

/*===== Shared Fields =====*/
const emailField = z
  .string()
  .trim()
  .min(1, "ایمیل خود را وارد کنید.")
  .pipe(z.email("ایمیل معتبر نیست. مثال درست: sara@example.com"));

/*===== Login =====*/
export const loginSchema = z.object({
  email: emailField,
  // Length rules belong to sign-up only; here any typo should reach the server's single answer.
  password: z.string().min(1, "رمز عبور را وارد کنید."),
});

export type LoginValues = z.infer<typeof loginSchema>;

/*===== Sign-up =====*/
// Limits match Better-Auth's defaults (8–128) so most mistakes are caught before submitting.
export const signupSchema = z.object({
  name: z.string().trim().min(2, "نام خود را وارد کنید.").max(50, "نام حداکثر ۵۰ حرف است."),
  email: emailField,
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.").max(128, "رمز عبور حداکثر ۱۲۸ کاراکتر است."),
  // Filled by the Altcha widget once the proof-of-work is solved.
  altcha: z.string().min(1, "لطفاً تأیید امنیتی را کامل کنید."),
});

export type SignupValues = z.infer<typeof signupSchema>;
