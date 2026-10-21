/*===== Roll Columns =====*/
/**
 * The roll's tracks from `xl`, shared by its column head and every row so the columns line up down the plate: the
 * disc, the name with its chips, the number, «ثبت‌نام», «آخرین ورود», the dogs or the partner's code, and the chevron.
 * Everything but the name has a fixed width, so the eye can run straight down a column; the name takes what is left.
 */
export const ROLL_COLUMNS = "xl:grid-cols-[2.25rem_minmax(0,1fr)_8.75rem_7rem_6.5rem_6.5rem_1.25rem] xl:gap-x-5";

/** The roll's side padding, the same on the head and the rows. */
export const ROLL_PADDING = "px-4 sm:px-5 xl:px-6";
