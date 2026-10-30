import { describe, it, expect } from 'vitest';
import { aggregateAnalytics } from './analytics';
it('counts only the last 30 days and groups links', () => {
  const now = new Date('2026-10-27T00:00:00Z');
  expect(
    aggregateAnalytics(
      [{ createdAt: now }, { createdAt: new Date('2020-01-01') }],
      [
        { linkId: 'a', createdAt: now },
        { linkId: 'a', createdAt: now },
        { linkId: 'b', createdAt: new Date('2020-01-01') },
      ],
      now,
    ),
  ).toEqual({ views: 1, clicks: 2, byLink: { a: 2 } });
});
it('handles no activity', () =>
  expect(aggregateAnalytics([], [])).toEqual({ views: 0, clicks: 0, byLink: {} }));

import { buildSeries, compareDelta, parseRange, periodBounds, rankLinks } from './analytics';

describe('analytics reporting helpers', () => {
  const now = new Date('2026-10-31T15:30:00Z');

  it('accepts only supported ranges', () => {
    expect(parseRange('7')).toBe(7);
    expect(parseRange(['90'])).toBe(90);
    expect(parseRange('365')).toBe(30);
    expect(parseRange(undefined)).toBe(30);
  });

  it('builds periods of whole UTC days ending today', () => {
    const { start, previousStart } = periodBounds(7, now);
    expect(start.toISOString()).toBe('2026-10-25T00:00:00.000Z');
    expect(previousStart.toISOString()).toBe('2026-10-18T00:00:00.000Z');
  });

  it('zero-fills the series and ignores rows outside the period', () => {
    const series = buildSeries(
      3,
      now,
      [
        { day: new Date('2026-10-30T00:00:00Z'), count: 4 },
        { day: new Date('2026-09-01T00:00:00Z'), count: 99 },
      ],
      [{ day: new Date('2026-10-31T00:00:00Z'), count: 2 }],
    );
    expect(series).toEqual([
      { date: '2026-10-29', views: 0, clicks: 0 },
      { date: '2026-10-30', views: 4, clicks: 0 },
      { date: '2026-10-31', views: 0, clicks: 2 },
    ]);
  });

  it('reports honest deltas', () => {
    expect(compareDelta(0, 0)).toEqual({ direction: 'none', label: '' });
    expect(compareDelta(5, 0)).toEqual({ direction: 'up', label: '+5' });
    expect(compareDelta(3, 3)).toEqual({ direction: 'flat', label: 'No change' });
    expect(compareDelta(6, 3)).toEqual({ direction: 'up', label: '+3' });
    expect(compareDelta(2, 5)).toEqual({ direction: 'down', label: '−3' });
    expect(compareDelta(150, 100)).toEqual({ direction: 'up', label: '+50%' });
    expect(compareDelta(50, 100)).toEqual({ direction: 'down', label: '−50%' });
  });

  it('ranks links and separates those with no clicks', () => {
    const { total, top, unclicked } = rankLinks([
      { id: 'a', title: 'A', url: 'https://a.test', clicks: 1 },
      { id: 'b', title: 'B', url: 'https://b.test', clicks: 3 },
      { id: 'c', title: 'C', url: 'https://c.test', clicks: 0 },
    ]);
    expect(total).toBe(4);
    expect(top.map((l) => l.id)).toEqual(['b', 'a']);
    expect(unclicked.map((l) => l.id)).toEqual(['c']);
  });
});
