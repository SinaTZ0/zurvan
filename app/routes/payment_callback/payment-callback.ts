import { createFileRoute } from "@tanstack/react-router";

import { db } from "~/db/client.server";
import { localizedPath } from "~/lib/i18n";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { CART_RESULT_PATH, PAYMENT_LOCALE_PARAM } from "~/orpc/checkout/constants";
import { completeGatewayPayment } from "~/orpc/checkout/service";

/*===== Payment Callback =====*/
/**
 * Where the gateway sends the customer back after paying (`?Authority=…&Status=OK|NOK`, Zarinpal's convention, which
 * the demo gateway follows). The payment is verified server-side and settled exactly once (F5), then the customer lands
 * on the Cart with the result as a banner. No session is needed: the authority token identifies the payment.
 *
 * The callback's address has no language (`/payment` is outside Paraglide's routing), so the cart it leads back to is
 * in the language the customer paid from, which `checkout.pay` wrote into the callback URL (`?lang=en`).
 */
export const Route = createFileRoute("/payment/callback")({
  server: { handlers: { GET: ({ request }) => settle(request) } },
});

/** A plain 302, as the gateway's redirect back expects; the Cart page is a full page load. */
function redirect(location: string) {
  return new Response(null, { status: 302, headers: { Location: location, "Cache-Control": "no-store" } });
}

async function settle(request: Request) {
  const params = new URL(request.url).searchParams;
  const locale = params.get(PAYMENT_LOCALE_PARAM) === "en" ? "en" : "fa";
  const cart = (query = "") => redirect(localizedPath({ path: `${CART_RESULT_PATH}${query}`, locale }));

  const authority = params.get("Authority");
  if (!authority) return cart();

  const result = await completeGatewayPayment({ db, gateway: getPaymentGateway(), authority, callbackParams: params });
  if (result.kind === "unknown") return cart();

  // A repeated callback lands on the same banner as the first one did.
  const failed = result.kind === "failed" || (result.kind === "already-settled" && result.status === "failed");
  const banner = failed ? "failed" : "paid";
  return cart(`?payment=${banner}`);
}
