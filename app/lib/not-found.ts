import { ORPCError } from "@orpc/client";
import { notFound } from "@tanstack/react-router";

/*===== Not Found =====*/
/**
 * Waits for a loader's read and turns the API's `NOT_FOUND` into the router's `notFound()`, so a missing course, dog
 * or certificate renders the route's `notFoundComponent` with a real 404 status instead of an error.
 *
 * @throws `notFound()` for `NOT_FOUND`; any other error as it came.
 */
export async function orNotFound<T>(read: Promise<T>): Promise<T> {
  try {
    return await read;
  } catch (error) {
    if (error instanceof ORPCError && error.code === "NOT_FOUND") throw notFound();
    throw error;
  }
}
