function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

// Buckets a sparse {"YYYY-MM-DD": {field: number}} map into fixed 7-day windows
// starting at `startDate`, filling any day with no data as 0 so the timeline stays
// continuous (a week with zero activity should show as a dip, not a gap).
export function bucketWeekly(startDate, endDate, dailyByDate, fields) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const totalDays = Math.max(Math.round((end - start) / 86400000) + 1, 1);
  const weeks = [];

  for (let offset = 0; offset < totalDays; offset += 7) {
    const weekStart = new Date(start.getTime() + offset * 86400000);
    const weekEnd = new Date(Math.min(weekStart.getTime() + 6 * 86400000, end.getTime()));
    const bucket = { week_start: toDateStr(weekStart), week_end: toDateStr(weekEnd) };
    fields.forEach((field) => (bucket[field] = 0));

    for (let d = weekStart.getTime(); d <= weekEnd.getTime(); d += 86400000) {
      const row = dailyByDate[toDateStr(new Date(d))];
      if (row) fields.forEach((field) => (bucket[field] += Number(row[field]) || 0));
    }
    weeks.push(bucket);
  }

  return weeks;
}

// Same 7-day windows as bucketWeekly, but counts DISTINCT ids per week instead of
// summing a metric — daily counts can't be summed into a weekly "active users"
// figure without double-counting someone active on more than one day that week.
export function bucketWeeklyDistinct(startDate, endDate, rows, dateField, idField, outField) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const totalDays = Math.max(Math.round((end - start) / 86400000) + 1, 1);
  const weeks = [];

  for (let offset = 0; offset < totalDays; offset += 7) {
    const weekStart = new Date(start.getTime() + offset * 86400000);
    const weekEnd = new Date(Math.min(weekStart.getTime() + 6 * 86400000, end.getTime()));
    weeks.push({
      week_start: toDateStr(weekStart),
      week_end: toDateStr(weekEnd),
      _startMs: weekStart.getTime(),
      _endMs: weekEnd.getTime(),
      _ids: new Set(),
    });
  }

  for (const row of rows) {
    const t = new Date(`${String(row[dateField]).slice(0, 10)}T00:00:00Z`).getTime();
    const bucket = weeks.find((w) => t >= w._startMs && t <= w._endMs);
    if (bucket) bucket._ids.add(row[idField]);
  }

  return weeks.map(({ week_start, week_end, _ids }) => ({ week_start, week_end, [outField]: _ids.size }));
}

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
