# Playwright run reports

Every Playwright invocation creates a sortable UTC folder, with an optional Git SHA suffix:
- **bug-report.json**: failed, timed-out and flaky tests sorted by criticality, with BUG IDs, errors, reproduction steps and attachment references.
- **technical-report.json**: every test, including skipped tests, grouped by feature, category and severity.
- **run-summary.json**: environment, totals, pass rates and release risk.

Run `npm run runs:latest` to print the latest path and summary. Runtime folders are ignored by Git. CI uploads them even after failures.

Categories: happy (expected outcome), negative (safe rejection), edge (boundaries/unusual valid states).
Severity: critical (authentication, isolation, data loss, public delivery), high (core CRUD and safety), medium (profile, ordering and validation), low (presentation).

Risk is blocked for critical failures/flakes or entirely unexecuted tests; high for high-severity failures; medium for other failures/flakes or partial skips; low only when all tests pass. Missing credentials always produce skipped entries with a reason and blocked risk.

Schemas validate reports before writes. Errors are redacted and report failures are printed without concealing Playwright outcomes. Screenshots are copied to attachments/. Trace and video capture are disabled because raw traces can contain auth tokens and request credentials. Enabling them requires an attachment scrubber; the current reporter deliberately does not copy raw trace/video files.
