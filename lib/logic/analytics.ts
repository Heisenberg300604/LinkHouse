export function aggregateAnalytics(
  views: { createdAt: Date }[],
  clicks: { linkId: string; createdAt: Date }[],
  now = new Date(),
) {
  const cutoff = now.getTime() - 30 * 86400000;
  const within = (item: { createdAt: Date }) =>
    item.createdAt.getTime() >= cutoff && item.createdAt <= now;
  const recent = clicks.filter(within),
    byLink: Record<string, number> = {};
  for (const click of recent) byLink[click.linkId] = (byLink[click.linkId] ?? 0) + 1;
  return { views: views.filter(within).length, clicks: recent.length, byLink };
}

/* ── Reporting helpers for the analytics page ─────────────────── */

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

export function parseRange(value: string | string[] | undefined): Range {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 30;
}

export type DayPoint = { date: string; views: number; clicks: number };

export const dayKey = (date: Date) => date.toISOString().slice(0, 10);

/**
 * A period is `days` whole UTC days ending today (today is partial).
 * The previous period is the same number of days immediately before it.
 */
export function periodBounds(days: number, now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = new Date(today - (days - 1) * 86400000);
  const previousStart = new Date(start.getTime() - days * 86400000);
  return { start, previousStart, end: now };
}

/** One point per day, zero-filled so quiet days still appear on the chart. */
export function buildSeries(
  days: number,
  now: Date,
  views: { day: Date; count: number }[],
  clicks: { day: Date; count: number }[],
): DayPoint[] {
  const { start } = periodBounds(days, now);
  const points = new Map<string, DayPoint>();
  for (let i = 0; i < days; i++) {
    const date = dayKey(new Date(start.getTime() + i * 86400000));
    points.set(date, { date, views: 0, clicks: 0 });
  }
  for (const row of views) {
    const point = points.get(dayKey(row.day));
    if (point) point.views += row.count;
  }
  for (const row of clicks) {
    const point = points.get(dayKey(row.day));
    if (point) point.clicks += row.count;
  }
  return [...points.values()];
}

export type Delta = {
  direction: 'up' | 'down' | 'flat' | 'none';
  /** Human text, e.g. "+12%" or "+3". Empty when there is nothing honest to say. */
  label: string;
};

/**
 * Compares two periods without overstating small samples: with fewer than 10 events on
 * either side a percentage is misleading, so the absolute difference is shown instead.
 */
export function compareDelta(current: number, previous: number): Delta {
  if (current === 0 && previous === 0) return { direction: 'none', label: '' };
  if (previous === 0) return { direction: 'up', label: '+' + current };
  const diff = current - previous;
  if (diff === 0) return { direction: 'flat', label: 'No change' };
  const direction = diff > 0 ? 'up' : 'down';
  if (Math.max(current, previous) < 10)
    return { direction, label: (diff > 0 ? '+' : '−') + Math.abs(diff) };
  const pct = Math.round((Math.abs(diff) / previous) * 100);
  return { direction, label: (diff > 0 ? '+' : '−') + pct + '%' };
}

export type LinkStat = { id: string; title: string; url: string; clicks: number };

export function rankLinks(links: LinkStat[]) {
  const ranked = [...links].sort((a, b) => b.clicks - a.clicks || a.title.localeCompare(b.title));
  const total = ranked.reduce((sum, link) => sum + link.clicks, 0);
  return {
    total,
    ranked,
    top: ranked.filter((link) => link.clicks > 0),
    unclicked: ranked.filter((link) => link.clicks === 0),
  };
}
