/** Only the configured IP can select HTTP; unknown hosts and forwarded headers use the primary origin. */
export function resolvePublicOrigin(headers: Headers, primaryURL: string, httpIP?: string): string {
  const host = headers.get("host");
  if (httpIP && (host === httpIP || host === `${httpIP}:80`)) return `http://${httpIP}`;
  return new URL(primaryURL).origin;
}
