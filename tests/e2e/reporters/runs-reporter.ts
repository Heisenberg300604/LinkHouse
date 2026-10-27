import type { Reporter, FullConfig, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  buildBugReport,
  buildTechnicalReport,
  buildRunSummary,
  redact,
  sanitizePath,
  type Result,
} from './logic';
import { bugSchema, technicalSchema, summarySchema } from './schemas';
const require = createRequire(import.meta.url);
function git(args: string[]) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}
export default class RunsReporter implements Reporter {
  private startedAt = new Date().toISOString();
  private config!: FullConfig;
  private suite!: Suite;
  private results = new Map<string, { test: TestCase; result: TestResult }>();
  onBegin(config: FullConfig, suite: Suite) {
    this.config = config;
    this.suite = suite;
  }
  onTestEnd(test: TestCase, result: TestResult) {
    this.results.set(test.id, { test, result });
  }
  onEnd() {
    try {
      const finishedAt = new Date().toISOString(),
        sha = git(['rev-parse', '--short', 'HEAD']);
      const runId = this.startedAt.replace(/[:.]/g, '-') + (sha ? '-' + sha : '');
      const dir = path.join('runs', runId);
      mkdirSync(dir, { recursive: true });
      const records: Result[] = this.suite.allTests().map((test) => {
        const result = this.results.get(test.id)?.result ?? test.results.at(-1);
        const annotations = Object.fromEntries(
          test.annotations.map((a) => [a.type, a.description]),
        );
        for (const key of ['category', 'severity', 'feature', 'description'])
          if (!annotations[key]) throw new Error('Missing ' + key + ' metadata for ' + test.title);
        const project = test.parent.project();
        const status =
          result?.status === 'skipped'
            ? 'skipped'
            : test.outcome() === 'flaky'
              ? 'flaky'
              : result?.status === 'passed'
                ? 'passed'
                : result?.status === 'timedOut'
                  ? 'timedOut'
                  : result
                    ? 'failed'
                    : 'skipped';
        const attachments: Result['attachments'] = { screenshot: null, trace: null, video: null };
        // Traces and videos may contain Clerk credentials. Only screenshots are safe to retain by default.
        for (const a of result?.attachments ?? []) {
          if (a.path && a.name === 'screenshot') {
            mkdirSync(path.join(dir, 'attachments'), { recursive: true });
            const name = sanitizePath(test.id) + '-' + sanitizePath(a.path);
            copyFileSync(a.path, path.join(dir, 'attachments', name));
            attachments.screenshot = 'attachments/' + name;
          }
        }
        return {
          id: test.id,
          title: redact(test.title),
          file: path.relative(process.cwd(), test.location.file),
          line: test.location.line,
          feature: annotations.feature!,
          category: annotations.category as Result['category'],
          severity: annotations.severity as Result['severity'],
          description: annotations.description!,
          status,
          skipReason:
            status === 'skipped'
              ? (annotations.skip ?? 'Missing credentials or database configuration')
              : null,
          durationMs: test.results.reduce((n, r) => n + r.duration, 0),
          retries: result?.retry ?? 0,
          browser: project?.name ?? 'chromium',
          viewport: project?.use.viewport ?? null,
          steps: (result?.steps ?? [])
            .filter((s) => s.category === 'test.step')
            .map((s) => ({
              title: redact(s.title),
              status: s.error ? 'failed' : 'passed',
              durationMs: s.duration,
            })),
          errorMessage: redact(result?.error?.message ?? ''),
          stackTrace: redact(result?.error?.stack ?? ''),
          attachments,
        };
      });
      const environment = {
        baseURL: redact(this.config.projects[0]?.use.baseURL ?? ''),
        node: process.version,
        playwrightVersion: require('@playwright/test/package.json').version,
        os: os.platform(),
        ci: !!process.env.CI,
        gitBranch: git(['branch', '--show-current']),
        gitSha: sha,
      };
      const outputs = [
        ['bug-report.json', bugSchema.parse(buildBugReport(runId, finishedAt, records))],
        [
          'technical-report.json',
          technicalSchema.parse(buildTechnicalReport(runId, finishedAt, records)),
        ],
        [
          'run-summary.json',
          summarySchema.parse(
            buildRunSummary(runId, this.startedAt, finishedAt, records, environment),
          ),
        ],
      ] as const;
      for (const [name, value] of outputs)
        writeFileSync(path.join(dir, name), JSON.stringify(value, null, 2) + '\n');
      console.log('Run reports: ' + dir);
    } catch (error) {
      console.error(
        'Run report validation or write failed: ' +
          redact(error instanceof Error ? error.message : String(error)),
      );
    }
  }
}
