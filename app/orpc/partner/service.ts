import type { DatabaseOrTransaction } from "~/db/client.server";
import { issuesToErrorData } from "~/lib/schema-issues";
import type { PartnerProfile } from "~/orpc/partner/contract";
import { findShebaNumber, updateShebaNumber } from "~/orpc/partner/repository";
import { partnerProfileInputSchema } from "~/orpc/partner/validation";

/*===== Types =====*/
type Own = { db: DatabaseOrTransaction; userId: string };

type NotFoundResult = { kind: "not-found" };

/*===== Get =====*/
type GetProfileResult = { kind: "success"; profile: PartnerProfile } | NotFoundResult;

/** @returns `not-found` for a partner user with no `partner` row. */
export async function getPartnerProfile({ db, userId }: Own): Promise<GetProfileResult> {
  const row = await findShebaNumber({ db, userId });
  return row ? { kind: "success", profile: { shebaNumber: row.shebaNumber } } : { kind: "not-found" };
}

/*===== Update =====*/
type UpdateProfileResult =
  | { kind: "success"; profile: PartnerProfile }
  | { kind: "invalid"; errors: string[]; fields: Record<string, string> }
  | NotFoundResult;

/**
 * F1: the partner writes the Sheba number the Admin pays commissions to. The raw text is normalized and checked (format
 * and checksum) before anything is stored. The write targets the caller's own row; no partner id comes from the input.
 */
export async function updatePartnerProfile({
  db,
  userId,
  input,
}: Own & { input: { shebaNumber: string } }): Promise<UpdateProfileResult> {
  /*------ Validate ------*/
  const parsed = partnerProfileInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  /*------ Store ------*/
  const row = await updateShebaNumber({ db, userId, shebaNumber: parsed.data.shebaNumber });
  return row ? { kind: "success", profile: { shebaNumber: row.shebaNumber } } : { kind: "not-found" };
}
