import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { redirect, useNavigate } from "react-router";

import { toast } from "~/components/ui/toast";
import { authClient } from "~/lib/auth-client";
import { auth } from "~/lib/auth.server";
import { orpc } from "~/orpc/client";
import { createServerClient } from "~/orpc/server-client.server";
import { AddPetForm } from "~/routes/pets/components/add-pet-form";
import { FamilyHero } from "~/routes/pets/components/family-hero";
import { PetList } from "~/routes/pets/components/pet-list";
import { PetsHeader } from "~/routes/pets/components/pets-header";

import type { Route } from "./+types/pets";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "حیوان‌های من | زروان" }];

/*===== Loader =====*/
// Render-critical: the list renders on the server, then TanStack Query takes over for updates.
export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw redirect("/auth");

  const pets = await createServerClient(request).pet.list();

  // Persian names go first-name-first, and the greeting uses only the first name.
  const firstName = session.user.name.trim().split(/\s+/)[0] ?? session.user.name;
  return { firstName, pets };
}

/*===== Page =====*/
export default function PetsPage({ loaderData }: Route.ComponentProps) {
  const { firstName } = loaderData;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /*------ Data ------*/
  const { data: pets } = useQuery(orpc.pet.list.queryOptions({ initialData: loaderData.pets }));

  /*------ Sign Out ------*/
  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message ?? "Sign-out failed");
    },
    onSuccess: async () => {
      await navigate("/auth", { viewTransition: true });
      // The next account on this device must not see this user's cached pets. Cleared after leaving
      // the page: clearing while the list is mounted would refetch it without a session.
      queryClient.clear();
    },
    onError: () => {
      toast.add({ title: "خروج انجام نشد. دوباره امتحان کنید.", type: "error" });
    },
  });

  return (
    <div className="min-h-svh">
      <PetsHeader onSignOut={() => signOut.mutate()} isSigningOut={signOut.isPending} />

      <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start lg:gap-10">
        {/*===== Family =====*/}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl">سلام {firstName} جان 👋</h1>
            <p className="text-muted-foreground">امروز برای خانواده‌ات چه کاری انجام بدیم؟</p>
          </div>
          <FamilyHero pets={pets} />
          <PetList pets={pets} />
        </div>

        {/*===== Add Pet =====*/}
        <AddPetForm className="lg:sticky lg:top-6" />
      </main>
    </div>
  );
}
