import { config } from 'dotenv';
import { execFileSync } from 'node:child_process';
import { assertTestDatabase } from '../lib/logic/database-safety';
config({ path: '.env.local', quiet: true });
const url = process.env.TEST_DATABASE_URL,
  direct = process.env.TEST_DIRECT_URL;
if (!url || !direct) {
  console.log('SKIPPED test migrations: TEST_DATABASE_URL / TEST_DIRECT_URL missing.');
} else {
  assertTestDatabase(url, process.env.DATABASE_URL);
  assertTestDatabase(direct, process.env.DIRECT_URL);
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: direct },
  });
}
