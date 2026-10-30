import type { DayPoint } from './logic/analytics';

/**
 * Sample data for the public /demo page. It is generated, deterministic (no Math.random, so
 * server and client render identically) and never mixed with real analytics.
 */
export function sampleSeries(days: number, anchor = new Date('2026-10-31T00:00:00Z')): DayPoint[] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(anchor.getTime() - (days - 1 - i) * 86400000);
    const weekday = date.getUTCDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.72 : 1;
    const growth = 1 + (i / days) * 0.55;
    const wave = 1 + 0.22 * Math.sin(i * 1.7) + 0.12 * Math.cos(i * 0.9);
    const views = Math.round(46 * growth * weekend * wave);
    const clicks = Math.round(views * (0.34 + 0.05 * Math.sin(i * 0.6)));
    return { date: date.toISOString().slice(0, 10), views, clicks };
  });
}

/** Splits `total` across `weights` with the largest-remainder method, so parts always sum to `total`. */
export function distribute(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum || total <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (w / sum) * total);
  const parts = exact.map(Math.floor);
  let remainder = total - parts.reduce((a, b) => a + b, 0);
  exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)
    .forEach(({ index }) => {
      if (remainder-- > 0) parts[index]++;
    });
  return parts;
}
