import { z } from 'zod';
const totals = z.object({
  total: z.number(),
  passed: z.number(),
  failed: z.number(),
  flaky: z.number(),
  skipped: z.number(),
  timedOut: z.number(),
});
const status = z.enum(['passed', 'failed', 'flaky', 'skipped', 'timedOut']);
const severity = z.enum(['critical', 'high', 'medium', 'low']);
const category = z.enum(['happy', 'negative', 'edge']);
export const bugSchema = z.object({
  runId: z.string(),
  generatedAt: z.string(),
  totalBugs: z.number(),
  bugs: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      testTitle: z.string(),
      testFile: z.string(),
      feature: z.string(),
      category,
      severity,
      status: z.enum(['failed', 'timedOut', 'flaky']),
      stepsToReproduce: z.array(z.string()),
      expected: z.string(),
      actual: z.string(),
      errorMessage: z.string(),
      stackTrace: z.string(),
      retries: z.number(),
      durationMs: z.number(),
      browser: z.string(),
      viewport: z.unknown(),
      attachments: z.object({
        screenshot: z.string().nullable(),
        trace: z.string().nullable(),
        video: z.string().nullable(),
      }),
    }),
  ),
});
export const technicalSchema = z.object({
  runId: z.string(),
  generatedAt: z.string(),
  totals,
  bySeverity: z.record(z.string(), totals),
  byCategory: z.record(z.string(), totals),
  byFeature: z.record(z.string(), totals),
  tests: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      file: z.string(),
      line: z.number(),
      feature: z.string(),
      category,
      severity,
      criticalityReason: z.string(),
      description: z.string(),
      status,
      skipReason: z.string().nullable(),
      durationMs: z.number(),
      retries: z.number(),
      browser: z.string(),
      viewport: z.unknown(),
      steps: z.array(z.object({ title: z.string(), status: z.string(), durationMs: z.number() })),
      bugId: z.string().nullable(),
    }),
  ),
});
export const summarySchema = z.object({
  runId: z.string(),
  startedAt: z.string(),
  finishedAt: z.string(),
  durationMs: z.number(),
  environment: z.record(z.string(), z.unknown()),
  totals,
  passRate: z.number().min(0).max(100),
  criticalPassRate: z.number().min(0).max(100),
  releaseRisk: z.enum(['low', 'medium', 'high', 'blocked']),
  releaseRiskReason: z.string(),
  files: z.object({ bugReport: z.string(), technicalReport: z.string() }),
});
