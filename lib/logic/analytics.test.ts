import { it, expect } from 'vitest';
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
