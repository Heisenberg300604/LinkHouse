import { it, expect } from 'vitest';
import {
  buildBugReport,
  buildTechnicalReport,
  buildRunSummary,
  computeReleaseRisk,
  redact,
  sanitizePath,
  type Result,
} from './logic';
export const result = (patch: Partial<Result> = {}): Result => ({
  id: '1',
  title: 'test',
  file: 'tests/example.ts',
  line: 1,
  feature: 'links',
  category: 'happy',
  severity: 'high',
  description: 'Creates a link',
  status: 'passed',
  skipReason: null,
  durationMs: 10,
  retries: 0,
  browser: 'chromium',
  viewport: { width: 1280, height: 720 },
  steps: [],
  errorMessage: '',
  stackTrace: '',
  attachments: { screenshot: null, trace: null, video: null },
  ...patch,
});
it('blocks a run that did not execute', () =>
  expect(computeReleaseRisk([result({ status: 'skipped' })]).releaseRisk).toBe('blocked'));
it.each(['failed', 'flaky', 'timedOut'] as const)('blocks critical %s', (status) =>
  expect(computeReleaseRisk([result({ status, severity: 'critical' })]).releaseRisk).toBe(
    'blocked',
  ),
);
it('marks high failures high risk', () =>
  expect(computeReleaseRisk([result({ status: 'failed' })]).releaseRisk).toBe('high'));
it('marks lower failures and flakes medium risk', () => {
  expect(computeReleaseRisk([result({ status: 'failed', severity: 'low' })]).releaseRisk).toBe(
    'medium',
  );
  expect(computeReleaseRisk([result({ status: 'flaky' })]).releaseRisk).toBe('medium');
});
it('marks all executed passes low risk', () =>
  expect(computeReleaseRisk([result()]).releaseRisk).toBe('low'));
it('sorts bugs by severity and assigns stable IDs', () => {
  const r = buildBugReport('run', 'now', [
    result({ status: 'failed', severity: 'low' }),
    result({ id: '2', status: 'flaky', severity: 'critical' }),
  ]);
  expect(r.totalBugs).toBe(2);
  expect(r.bugs[0]).toMatchObject({ id: 'BUG-001', severity: 'critical' });
});
it('counts every outcome', () => {
  const tests = (['passed', 'failed', 'flaky', 'skipped', 'timedOut'] as const).map((status) =>
    result({ status }),
  );
  expect(buildTechnicalReport('run', 'now', tests).totals).toEqual({
    total: 5,
    passed: 1,
    failed: 1,
    flaky: 1,
    skipped: 1,
    timedOut: 1,
  });
});
it('computes pass rates without counting skips as passes', () => {
  const r = buildRunSummary(
    'run',
    '2026-01-01T00:00:00Z',
    '2026-01-01T00:00:01Z',
    [result({ severity: 'critical' }), result({ status: 'skipped' })],
    {},
  );
  expect(r.passRate).toBe(50);
  expect(r.criticalPassRate).toBe(100);
});
it('redacts credentials in URLs and error strings', () => {
  const s = redact('https://user:secret@host/path?token=abc password=hunter2 sk_test_abcdef');
  expect(s).not.toContain('secret');
  expect(s).not.toContain('hunter2');
  expect(s).not.toContain('abcdef');
  expect(s).not.toContain('token=abc');
});
it('neutralizes traversal in attachment names', () =>
  expect(sanitizePath('../../private/token.txt')).toBe('token.txt'));
