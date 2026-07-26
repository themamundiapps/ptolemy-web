/** Best-effort parsing for the free-text date/time fields on the landing
 * page's signature form -- the full /chart form uses native date/time
 * pickers (ISO values), so whatever the user typed on the landing page needs
 * converting before it can prefill those inputs. Returns undefined rather
 * than guessing when the input doesn't match a recognized pattern, leaving
 * the field blank for the user to fill in properly. */
export function parseLooseDate(input: string): string | undefined {
  const trimmed = input.trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return trimmed;

  const dmy = trimmed.match(/^(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return undefined;
}

export function parseLooseTime(input: string): string | undefined {
  const match = input.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return undefined;
  const [, hour, minute] = match;
  const h = Number(hour);
  if (h > 23) return undefined;
  return `${hour.padStart(2, "0")}:${minute}`;
}
