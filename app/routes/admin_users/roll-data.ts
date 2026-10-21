import type { AdminDog } from "~/orpc/dog/contract";
import type { AdminPartner } from "~/orpc/partner/contract";

/*===== Types =====*/
/** A customer's dog as the dialog lists it: a print, a name and the way to its file. */
export type OwnedDog = Pick<AdminDog, "id" | "name" | "photo">;

/** What the roll says about a partner beyond his account: his referral code and whether his link counts. */
export type PartnerFacts = Pick<AdminPartner, "code" | "isActive">;

/*===== Indexes =====*/
/**
 * The loader's two side lists cut down to what the roll shows, keyed by the user's id (a partner's id is his user's),
 * so the page sends no leads, Sheba numbers or dog details it doesn't draw.
 */
export function indexRollData({ dogs, partners }: { dogs: readonly AdminDog[]; partners: readonly AdminPartner[] }) {
  const dogsByOwner: Record<string, OwnedDog[]> = {};
  for (const dog of dogs) (dogsByOwner[dog.owner.id] ??= []).push({ id: dog.id, name: dog.name, photo: dog.photo });

  const partnersById: Record<string, PartnerFacts> = {};
  for (const partner of partners) partnersById[partner.id] = { code: partner.code, isActive: partner.isActive };

  return { dogsByOwner, partnersById };
}
