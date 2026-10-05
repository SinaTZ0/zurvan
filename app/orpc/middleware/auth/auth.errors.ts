import { errorDataSchema } from "~/orpc/errors";

/*===== Auth Errors =====*/
// Browser-safe: declared on every contract whose procedure uses `requireUserMiddleware`.
export const authErrors = {
  UNAUTHORIZED: {
    message: "Sign in to continue.",
    data: errorDataSchema,
  },
};
