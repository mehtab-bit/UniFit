/**
 * Backend progression state may arrive as a single number (offline mock) or
 * as a per-activity map (live engine). Reduces both to one displayable week.
 */
export function resolveProgressionWeek(
  value: number | Record<string, number> | undefined
): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  if (value) {
    const strength = value.strength;
    const weeks = Object.values(value);
    if (strength !== undefined) return strength;
    if (weeks.length > 0) return Math.max(...weeks);
  }
  return undefined;
}
