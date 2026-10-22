import { formatNumber } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";

/*===== File Size =====*/
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = 1024 * 1024;

/** «۱۲ مگابایت», «۴۵۰ کیلوبایت» («12 MB», «450 KB»): a file's size as people say it, in the page's language. Browser-safe. */
export function formatFileSize(bytes: number): string {
  if (bytes >= BYTES_PER_MB) {
    const megabytes = bytes / BYTES_PER_MB;
    // One decimal for small files (a 1.5 MB clip), none once the digit stops mattering.
    return m.shared_file_size_mb({
      size: formatNumber(megabytes < 10 ? Math.round(megabytes * 10) / 10 : Math.round(megabytes)),
    });
  }
  return m.shared_file_size_kb({ size: formatNumber(Math.max(1, Math.round(bytes / BYTES_PER_KB))) });
}
