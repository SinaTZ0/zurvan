import { redirect } from "react-router";

import { db } from "~/db/client.server";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { completeGatewayPayment } from "~/orpc/order/service";

import type { Route } from "./+types/payment-callback";

/*===== Payment Callback =====*/
/**
 * Where the gateway sends the customer back after paying (`?Authority=…&Status=OK|NOK`, Zarinpal's convention, which
 * the demo gateway follows). The payment is verified server-side and settled exactly once, then the customer lands on
 * the payment result page. No session is needed: the authority token identifies the payment, and the result page
 * checks who is looking.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  const authority = params.get("Authority");
  if (!authority) return redirect("/account");

  const result = await completeGatewayPayment({ db, gateway: getPaymentGateway(), authority, callbackParams: params });
  if (result.kind === "unknown") return redirect("/account");

  return redirect(`/account/checkout/${result.orderId}/result`);
}
