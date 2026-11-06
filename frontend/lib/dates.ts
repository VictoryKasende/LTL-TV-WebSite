/** `YYYY-MM-DD` of a Date in local time (the visitor's, or the server's
 *  TZ — Africa/Lubumbashi). Not `toISOString()`, which is UTC: east of
 *  Greenwich, local midnight is still "yesterday" there. */
export function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
