/*===== Register Columns =====*/
/**
 * The register's tracks from `xl`, shared by its column head and every row so the columns line up down the plate: the
 * dog (its print, name and facts), the owner, the passed courses, the stamp and the chevron. The owner and the stamp
 * have fixed widths so the eye can run straight down them; the dog and its courses share what is left.
 */
export const REGISTER_COLUMNS = "xl:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1.1fr)_7.25rem_1.25rem] xl:gap-x-5";

/** The register's side padding, the same on the head and the rows. */
export const REGISTER_PADDING = "px-4 sm:px-5 xl:px-6";
