import { createLoader, parseAsInteger, parseAsStringLiteral } from "nuqs/server";

import { SMS_KINDS } from "~/orpc/sms/constants";

/*===== Parsers =====*/
// Both params are read by the loader (the API pages on the server), so they are not shallow: changing a filter or a page
// runs the loader. `kind` has no default: absent means every kind. `page` is 1-based in the URL, 0-based for the API.
export const smsSearchParams = {
  kind: parseAsStringLiteral(SMS_KINDS),
  page: parseAsInteger.withDefault(1),
};

/*===== Server Loader =====*/
export const loadSmsSearchParams = createLoader(smsSearchParams);
