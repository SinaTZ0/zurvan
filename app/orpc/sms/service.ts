import type { DatabaseOrTransaction } from "~/db/client.server";
import type { SmsKind } from "~/orpc/sms/constants";
import type { SmsList } from "~/orpc/sms/contract";
import { countSms, countSmsByKind, findSmsPage } from "~/orpc/sms/repository";

/*===== Outbox =====*/
/**
 * One page of the outbox for the Admin (F9). Read-only: nothing is sent, resent or deleted here. The three reads are
 * independent, so they run together; `kindCounts` ignores the filter so the pills keep their counts.
 */
export async function listSms({
  db,
  kind,
  page,
}: {
  db: DatabaseOrTransaction;
  kind?: SmsKind;
  page: number;
}): Promise<SmsList> {
  const [rows, total, kindCounts] = await Promise.all([
    findSmsPage({ db, kind, page }),
    countSms({ db, kind }),
    countSmsByKind({ db }),
  ]);

  return { items: rows, total, kindCounts };
}
