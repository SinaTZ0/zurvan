import { formatNumberFa } from "~/lib/digits";

/*===== File Size =====*/
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = 1024 * 1024;

/** «۱۲ مگابایت», «۴۵۰ کیلوبایت»: a file's size as people say it, in Persian digits. Browser-safe. */
export function formatFileSize(bytes: number): string {
  if (bytes >= BYTES_PER_MB) {
    const megabytes = bytes / BYTES_PER_MB;
    // One decimal for small files (a 1.5 MB clip), none once the digit stops mattering.
    return `${formatNumberFa(megabytes < 10 ? Math.round(megabytes * 10) / 10 : Math.round(megabytes))} مگابایت`;
  }
  return `${formatNumberFa(Math.max(1, Math.round(bytes / BYTES_PER_KB)))} کیلوبایت`;
}
