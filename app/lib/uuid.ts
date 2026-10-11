import { z } from "zod";

/*===== Ids =====*/
const idSchema = z.guid();

/**
 * Whether the text can be a row id (a uuid). Ids from the client are checked before they reach a query: a malformed
 * one would make Postgres throw, so services treat it as "no such row".
 */
export function isUuid(value: string): boolean {
  return idSchema.safeParse(value).success;
}
