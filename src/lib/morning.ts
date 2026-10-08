export const REMIND_HOUR = 9;
/** A change at 8:55 shouldn't nag at 9:00: the reminder lands at least this long after the change. */
const MIN_WAIT_MS = 8 * 3600_000;

/** The first REMIND_HOUR:00 that's at least MIN_WAIT_MS after `now`. */
export function nextMorning(now: Date) {
  const d = new Date(now);
  d.setHours(REMIND_HOUR, 0, 0, 0);
  while (d.getTime() - now.getTime() < MIN_WAIT_MS) d.setDate(d.getDate() + 1);
  return d;
}

/** If no backup follows, the reminder comes back this often, this many times in all (about two weeks). */
export const EVERY_DAYS = 3;
export const TIMES = 5;

/** The whole reminder series, scheduled up front: nothing in Kip runs when a notification fires. */
export function reminderDates(now: Date) {
  const first = nextMorning(now);
  return Array.from({ length: TIMES }, (_, i) => {
    const d = new Date(first);
    d.setDate(d.getDate() + i * EVERY_DAYS); // Calendar days, so it stays at 9:00 across DST.
    return d;
  });
}
