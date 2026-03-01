/**
 * Select one incomplete item suitable for the available time.
 * Uses a soft time filter (timeRequired <= availableTime * 1.75).
 * Returns null if:
 *  - availableTime is invalid
 *  - no incomplete items exist
 *  - no items fit within the soft time window
 */

export function selectWeekendItem(
  items: any[],
  availableTime: number
): any | null {
  // Guard: invalid time
  if (!availableTime || availableTime <= 0) {
    return null;
  }

  // Only incomplete items
  const incomplete = items.filter(
    (item) => item.completed === false
  );

  if (incomplete.length === 0) {
    return null;
  }

  // 1.75 multiplier
  const maxTime = availableTime * 1.75;

  const timeFiltered = incomplete.filter(
    (item) =>
      typeof item.timeRequired === 'number' &&
      item.timeRequired <= maxTime
  );

  if (timeFiltered.length === 0) {
    return null;
  }

  // Random selection from valid pool
  const randomIndex = Math.floor(
    Math.random() * timeFiltered.length
  );

  return timeFiltered[randomIndex];
}