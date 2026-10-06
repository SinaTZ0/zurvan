import { useQueryStates } from "nuqs";
import { redirect } from "react-router";

import { ThemeToggle } from "~/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { auth } from "~/lib/auth.server";
import { AuthBanner } from "~/routes/auth/components/auth-banner";
import { LoginForm } from "~/routes/auth/components/login-form";
import { SignupForm } from "~/routes/auth/components/signup-form";
import { TrustNote } from "~/routes/auth/components/trust-note";
import { type AuthTab, authSearchParams } from "~/routes/auth/search-params";

import type { Route } from "./+types/auth";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "ورود به زروان" },
  { name: "description", content: "ورود یا ساخت حساب در زروان، خدمات مطمئن برای حیوان خانگی شما." },
];

/*===== Loader =====*/
// Signed-in users have nothing to do here.
export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) throw redirect("/pets");
  return null;
}

/*===== Page =====*/
export default function AuthPage() {
  const [{ tab }, setSearchParams] = useQueryStates(authSearchParams);

  return (
    // Desktop splits the screen in two. In RTL the first column is the right one, so the banner comes
    // first in the DOM to sit on the right with the form on the left; it's also the reading order.
    <main className="min-h-svh lg:grid lg:grid-cols-2">
      {/* Top-left of the page (inline end in RTL), outside the narrow column. */}
      <ThemeToggle className="absolute end-4 top-4" />

      {/*===== Banner =====*/}
      {/* Sticky so it stays framed beside the form when the signup tab makes the page scroll. */}
      <div className="sticky top-0 hidden h-svh p-4 lg:block">
        <AuthBanner className="h-full" />
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-10 sm:py-16 lg:justify-center">
        {/*===== Welcome =====*/}
        <header className="flex flex-col items-center text-center">
          {/* Desktop shows the logo in the banner instead. */}
          <img
            src="/logo-stack.png"
            alt="زروان"
            width={180}
            height={170}
            className="h-28 w-auto lg:hidden dark:opacity-90 dark:brightness-0 dark:invert"
          />
          <h1 className="mt-4 text-[2rem] leading-tight text-primary lg:mt-0">به زروان خوش آمدید</h1>
          <p className="mt-3 max-w-72 text-muted-foreground">
            خدمات مطمئن و حرفه‌ای برای سلامتی، رفاه و همراهی بهتر حیوان خانگی شما.
          </p>
        </header>

        {/*===== Forms =====*/}
        <Tabs
          value={tab}
          onValueChange={(value: AuthTab) => void setSearchParams({ tab: value })}
          className="mt-8 gap-6"
        >
          <TabsList className="w-full rounded-lg p-1 group-data-horizontal/tabs:h-12">
            <TabsTrigger value="login" className="rounded-md text-sm font-bold">
              ورود
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-md text-sm font-bold">
              ثبت‌نام
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup">
            <SignupForm />
          </TabsContent>
        </Tabs>

        {/*===== Reassurance =====*/}
        <div className="mt-8">
          <TrustNote />
        </div>
      </div>
    </main>
  );
}
