# Linkhouse

A multi-user link-in-bio app with Clerk authentication, private editing, section organization, public profiles, and first-party click/view counts. Built in this repository with Next.js 16 App Router, strict TypeScript, Tailwind 4, a shadcn-style Button, React Hook Form/Zod, dnd-kit, Prisma and PostgreSQL.

## Local setup

Requires Node 24, npm, a Neon development database and **separate test branch**, and a Clerk development application.

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in real keys. No accounts, branches, or Clerk users are provisioned automatically.
3. Run `npm run db:migrate -- --name init`, then `npm run db:seed`.
4. Run `npm run db:test:migrate`.
5. Run `npm run dev`; visit http://localhost:3000 and http://localhost:3000/demo.
6. Install browsers with `npx playwright install chromium`, then run the checks below.

Without keys, the landing page and explicit setup notices work. Private routes redirect to sign-in. No fabricated identity, in-memory database, or SQLite fallback is used. Public data and tracking require Neon.

## Clerk setup

1. Create a Clerk development app in the Clerk dashboard.
2. Enable email/password and Google sign-in there. Authentication configuration belongs in Clerk, not this code.
3. Copy the publishable and secret keys into `.env.local`.
4. Configure sign-in at `/sign-in`, sign-up at `/sign-up`, with fallback redirects `/dashboard` and `/onboarding`.
5. Add a webhook endpoint `{APP_URL}/api/webhooks/clerk`, subscribing to `user.created`, `user.updated` and `user.deleted`. Copy its signing secret.
6. Create **two disposable test accounts manually** in the development instance. Enter their identifiers and passwords in the E2E variables. Tests never create Clerk accounts.
7. For local webhook delivery, expose port 3000 through ngrok or a Clerk CLI tunnel, then point the webhook at that HTTPS address.

Every dashboard server call resolves identity through `lib/auth.ts`. Lazy sync creates a local user when a webhook is delayed. Webhooks verify the raw body using Svix before parsing. Updates sync email while preserving user-edited display name/avatar. Account deletion deletes Clerk identity, then local data; the webhook is an idempotent fallback.

Next.js 16 uses `proxy.ts`, the successor to `middleware.ts`. Clerk prebuilt components share application colors, Inter and the shadcn theme.

## Neon setup

1. Create a Neon project manually.
2. Copy the pooled development connection (hostname includes `-pooler`) into `DATABASE_URL`.
3. Copy its direct connection into `DIRECT_URL`.
4. Create a separate `test` branch. Copy pooled/direct strings into `TEST_DATABASE_URL` and `TEST_DIRECT_URL`.
5. Apply the committed migration with `npm run db:migrate` locally, or `prisma migrate deploy` in deployments. Run `npm run db:test:migrate` for the test branch.

Prisma **6.19.3** deliberately preserves the requested schema-level `url` and `directUrl` contract. Prisma 7 moves datasource configuration to a different API. The standard client uses Neon's pooled connection; migrations use the direct URL. A singleton prevents hot-reload connection churn. The deepmerge-ts override patches the Prisma CLI dependency's recursive merge vulnerability.

The demo seed is idempotent and adds Alex Morgan at `/demo`, two sections and six links. It does not create a real Clerk account. Real database tests cover seed idempotence.

## Environment variables

| Variable                                              | Purpose                                 |
| ----------------------------------------------------- | --------------------------------------- |
| DATABASE_URL                                          | Development pooled Neon connection      |
| DIRECT_URL                                            | Development direct migration connection |
| TEST_DATABASE_URL                                     | Isolated test branch pooled connection  |
| TEST_DIRECT_URL                                       | Isolated test branch direct connection  |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY                     | Public Clerk key                        |
| CLERK_SECRET_KEY                                      | Server Clerk key                        |
| CLERK_WEBHOOK_SIGNING_SECRET                          | Svix endpoint signing secret            |
| NEXT_PUBLIC_CLERK_SIGN_IN_URL                         | /sign-in                                |
| NEXT_PUBLIC_CLERK_SIGN_UP_URL                         | /sign-up                                |
| NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL       | /dashboard                              |
| NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL       | /onboarding                             |
| NEXT_PUBLIC_APP_URL                                   | Canonical origin                        |
| E2E_CLERK_USER_USERNAME / E2E_CLERK_USER_PASSWORD     | First existing test account             |
| E2E_CLERK_USER_B_USERNAME / E2E_CLERK_USER_B_PASSWORD | Second existing test account            |

Never commit secrets. Only `NEXT_PUBLIC_` values are browser-exposed.

## Scripts

| Command                                                       | Purpose                                                |
| ------------------------------------------------------------- | ------------------------------------------------------ |
| npm run dev / build / start                                   | Development, production compilation, production server |
| npm run db:migrate                                            | Local Prisma migration, loading .env.local             |
| npm run db:seed                                               | Idempotent demo seed                                   |
| npm run db:test:migrate                                       | Guarded test-only migration deployment                 |
| npm test                                                      | All Vitest layers                                      |
| npm run test:unit                                             | Pure logic and report unit tests                       |
| npm run test:components                                       | RTL component interactions                             |
| npm run test:integration                                      | Real Postgres tests, skipped without test URL          |
| npm run test:watch                                            | Vitest watch mode                                      |
| npm run test:coverage                                         | Enforced full application coverage                     |
| npm run test:coverage:offline                                 | Pure logic/component coverage without DB adapters      |
| npm run test:e2e                                              | All categorized Playwright scenarios                   |
| npm run test:e2e:critical / test:e2e:negative / test:e2e:edge | Filtered Playwright runs                               |
| npm run runs:latest                                           | Latest report path and summary                         |
| npm run typecheck / lint                                      | TypeScript / ESLint                                    |
| npm run format                                                | Prettier                                               |
| node scripts/smoke.mjs                                        | Credential-free browser smoke checks against port 3000 |

## How we test

Pure behavior was developed with observed Red → Green cycles: URL/username/icon/order/limit rules first; reporting risk, counts and redaction next; Svix signatures; form interactions; analytics; database URL safety. The first core suite had 47 behavioral failures before implementation. Reporting had 11 failures, webhook verification 2, forms 7, analytics 1, and database safety 2.

Repository tests were written before implementations, but **their red/green database execution could not be observed without credentials**. Integration tests use real Prisma/Postgres with no Prisma mock, isolate users explicitly, and clear the dedicated test database between cases. The guard compares canonical hosts and database names, including pooled aliases. Never point these tests at valuable data.

Component tests exercise validation, debouncing, optimistic visibility rollback, editor dialogs, public rendering and deletion cancellation. Component server actions are mocked at their network boundary. E2E scenarios carry mandatory feature/category/severity/description annotations and searchable tags. Happy proves normal behavior; negative proves rejection; edge exercises boundaries. Severity is critical/high/medium/low.

E2E uses existing development Clerk users and resets their **test-database** rows before each test. It never creates Clerk accounts. Do not use a production Clerk application.

Full coverage enforces 80% lines/functions for application code and 90% for pure logic. Offline coverage separately excludes auth/database/server-action adapters because real Postgres/Clerk-backed execution is unavailable without keys. Do not interpret an offline coverage pass as full-stack verification.

The entire requested strict TDD workflow is **not yet fully satisfied**: server wiring and some dashboard/settings interactions were implemented before dedicated failing behavioral tests. The current suite also does not cover every detailed E2E scenario in the original brief. See `VERIFICATION.md` for measured results and remaining gaps.

## Test reports (runs/ folder)

Every Playwright run writes three Zod-validated JSON files under `runs/<UTC timestamp>[-git-sha]/`:

- `bug-report.json`: failed, timed-out or flaky tests, sorted by severity, BUG IDs and reproduction details.
- `technical-report.json`: every test's metadata, outcome, skip reason, steps and grouped totals.
- `run-summary.json`: environment, rates and release risk.

Critical failures/flakes block release. High failures are high risk; lower failures/flakes are medium. An entirely skipped run is **blocked**, with reason `e2e tests did not execute`. Skips never count as passes. JSON is indented, deterministic in field order, and redacted. Screenshots are copied; traces/video are disabled to avoid retaining credentials. This is a documented deviation from the requested trace-copy workflow.

## Product choices

- Empty visible sections are omitted publicly. Ungrouped links come first.
- Titles: 100 characters; descriptions: 200; section names: 60; display names: 80; bio: 160.
- Duplicate URLs are allowed. Only HTTP(S) is accepted; URL credentials are rejected.
- User row locks serialize link/section additions and enforce the 200/30 limits.
- Section removal can keep links ungrouped at the top, or cascade them.
- Hidden links/sections are filtered in server queries and hidden links cannot be followed via redirect IDs.
- Click/view writes use Next.js `after()`; failures do not break delivery. Counts represent requests, not deduplicated people.
- Visibility and reorder updates are optimistic with rollback. Other edits currently refresh the editor after saving.
- Icon detection covers major domains; Lucide generic platform-themed symbols are used because current Lucide removes brand icons. Custom icon text is stored, but rendering a custom icon set remains incomplete.
- System light/dark mode with a manual toggle; reduced-motion support; dnd-kit keyboard handles.
- Arbitrary HTTP(S) avatar URLs use unoptimized images to avoid a server-side image proxy.

## Deployment

Deploy to Vercel using the Node runtime. Add production Clerk/Neon variables; use development-only credentials for CI tests. Build command:

```sh
npx prisma migrate deploy && npm run build
```

Configure your production Clerk webhook to the deployed HTTPS URL. CI runs lint, types, tests, build and E2E and uploads `runs/` with `if: always()`. Configure separate test branch and disposable Clerk development account secrets in GitHub Actions. Missing keys yield explicit skips and blocked reports, not a release approval.

To rename the app, update package.json, app/layout.tsx metadata, wordmarks/copy in app/page.tsx and dashboard layout, and this README.

References: [Clerk Next.js setup](https://clerk.com/docs/nextjs/getting-started/quickstart), [Clerk Playwright](https://clerk.com/docs/guides/development/testing/playwright/overview), [Prisma v6 schema](https://www.prisma.io/docs/orm/v6/reference/prisma-schema-reference).
