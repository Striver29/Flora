const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Watering chip status derived from a plant's nextDueAt.
 * Calendar-day comparison: due before today → overdue, same day → today.
 * A plant with no schedule yet (null) needs its first watering now.
 * @param {string|null} nextDueAt ISO timestamp or null
 * @param {number} [now] epoch ms, defaults to Date.now()
 * @returns {{ key: 'waterNow' } | { key: 'today' } | { key: 'inDays', days: number }}
 */
export function waterStatus(nextDueAt, now = Date.now()) {
  if (!nextDueAt) return { key: 'waterNow' };
  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  const dueStart = new Date(nextDueAt).setHours(0, 0, 0, 0);
  if (dueStart < todayStart) return { key: 'waterNow' };
  if (dueStart === todayStart) return { key: 'today' };
  return { key: 'inDays', days: Math.round((dueStart - todayStart) / DAY_MS) };
}

/**
 * True when the plant needs water today (overdue or due today).
 * @param {string|null} nextDueAt
 * @param {number} [now]
 */
export function needsWaterToday(nextDueAt, now = Date.now()) {
  const status = waterStatus(nextDueAt, now);
  return status.key === 'waterNow' || status.key === 'today';
}
