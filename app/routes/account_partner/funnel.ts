/*===== Funnel =====*/
/** Who the partner's link and numbers brought, by how far they got (F7). Lost people are left out before this is built. */
export type PartnerFunnel = {
  /** Everyone not lost: the numbers entered and the customers the link brought. */
  numbers: number;
  /** Signed up, including those who went on to buy. */
  registered: number;
  bought: number;
};
