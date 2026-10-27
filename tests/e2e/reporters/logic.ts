export type Result = {
  id: string;
  title: string;
  file: string;
  line: number;
  feature: string;
  category: 'happy' | 'negative' | 'edge';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  status: 'passed' | 'failed' | 'flaky' | 'skipped' | 'timedOut';
  skipReason: string | null;
  durationMs: number;
  retries: number;
  browser: string;
  viewport: unknown;
  steps: { title: string; status: string; durationMs: number }[];
  errorMessage: string;
  stackTrace: string;
  attachments: { screenshot: string | null; trace: string | null; video: string | null };
};
export function redact(s: string): string {
  let out = s
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@/g, 'https://[REDACTED]@')
    .replace(/([?&](?:token|key|secret|password|code)=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/((?:password|cookie|authorization|token|secret)\s*[:=]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/(?:sk|pk)_(?:test|live)_[\w-]+/g, '[REDACTED]');
  for (const [key, value] of Object.entries(process.env))
    if (
      /SECRET|PASSWORD|TOKEN|DATABASE_URL|DIRECT_URL|E2E_CLERK_USER.*USERNAME/.test(key) &&
      value &&
      value.length > 3
    )
      out = out.split(value).join('[REDACTED]');
  return out;
}
export function sanitizePath(s: string): string {
  return s
    .replace(/\\/g, '/')
    .split('/')
    .pop()!
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}
const isBug = (t: Result) => ['failed', 'timedOut', 'flaky'].includes(t.status);
const ranks = { critical: 0, high: 1, medium: 2, low: 3 };
export function computeReleaseRisk(t: Result[]) {
  if (!t.length || t.every((x) => x.status === 'skipped'))
    return { releaseRisk: 'blocked', releaseRiskReason: 'e2e tests did not execute' };
  if (t.some((x) => x.severity === 'critical' && isBug(x)))
    return { releaseRisk: 'blocked', releaseRiskReason: 'A critical test failed or was flaky' };
  if (t.some((x) => x.severity === 'high' && ['failed', 'timedOut'].includes(x.status)))
    return { releaseRisk: 'high', releaseRiskReason: 'A high severity test failed' };
  if (t.some(isBug))
    return { releaseRisk: 'medium', releaseRiskReason: 'Failures or flaky tests need review' };
  if (t.some((x) => x.status === 'skipped'))
    return { releaseRisk: 'medium', releaseRiskReason: 'Some tests did not execute' };
  return { releaseRisk: 'low', releaseRiskReason: 'All tests passed' };
}
export function buildBugReport(runId: string, generatedAt: string, tests: Result[]) {
  const bugs = tests
    .filter(isBug)
    .sort((a, b) => ranks[a.severity] - ranks[b.severity] || a.feature.localeCompare(b.feature))
    .map((t, i) => ({
      id: 'BUG-' + String(i + 1).padStart(3, '0'),
      title: redact(t.description),
      testTitle: redact(t.title),
      testFile: t.file,
      feature: t.feature,
      category: t.category,
      severity: t.severity,
      status: t.status,
      stepsToReproduce: t.steps.map((s) => redact(s.title)),
      expected: t.description,
      actual: redact(t.errorMessage || t.status),
      errorMessage: redact(t.errorMessage),
      stackTrace: redact(t.stackTrace),
      retries: t.retries,
      durationMs: t.durationMs,
      browser: t.browser,
      viewport: t.viewport,
      attachments: t.attachments,
      testId: t.id,
    }));
  return { runId, generatedAt, totalBugs: bugs.length, bugs };
}
function totals(t: Result[]) {
  return {
    total: t.length,
    passed: t.filter((x) => x.status === 'passed').length,
    failed: t.filter((x) => x.status === 'failed').length,
    flaky: t.filter((x) => x.status === 'flaky').length,
    skipped: t.filter((x) => x.status === 'skipped').length,
    timedOut: t.filter((x) => x.status === 'timedOut').length,
  };
}
export function buildTechnicalReport(runId: string, generatedAt: string, tests: Result[]) {
  const bugs = buildBugReport(runId, generatedAt, tests).bugs;
  const group = (key: 'severity' | 'category' | 'feature', keys: string[]) =>
    Object.fromEntries(keys.map((value) => [value, totals(tests.filter((t) => t[key] === value))]));
  return {
    runId,
    generatedAt,
    totals: totals(tests),
    bySeverity: group('severity', Object.keys(ranks)),
    byCategory: group('category', ['happy', 'negative', 'edge']),
    byFeature: group('feature', [...new Set(tests.map((t) => t.feature))]),
    tests: tests.map(({ errorMessage, stackTrace, attachments, ...t }) => {
      void errorMessage;
      void stackTrace;
      void attachments;
      return {
        ...t,
        title: redact(t.title),
        criticalityReason: {
          critical: 'Authentication, isolation, public delivery or data loss',
          high: 'Core editing and input safety',
          medium: 'Profile, validation or ordering',
          low: 'Presentation and empty states',
        }[t.severity],
        steps: t.steps.map((s) => ({ ...s, title: redact(s.title) })),
        bugId: bugs.find((b) => b.testId === t.id)?.id ?? null,
      };
    }),
  };
}
export function buildRunSummary(
  runId: string,
  startedAt: string,
  finishedAt: string,
  tests: Result[],
  environment: Record<string, unknown>,
) {
  const rate = (t: Result[]) =>
    t.length
      ? Math.round((t.filter((x) => x.status === 'passed').length / t.length) * 10000) / 100
      : 0;
  return {
    runId,
    startedAt,
    finishedAt,
    durationMs: new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
    environment,
    totals: totals(tests),
    passRate: rate(tests),
    criticalPassRate: rate(tests.filter((t) => t.severity === 'critical')),
    ...computeReleaseRisk(tests),
    files: { bugReport: 'bug-report.json', technicalReport: 'technical-report.json' },
  };
}
