import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve('.') } },
  test: {
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts', 'features/**/*.{ts,tsx}', 'tests/e2e/reporters/logic.ts'],
      exclude: [
        '**/*.test.*',
        ...(process.env.OFFLINE_COVERAGE
          ? ['lib/db.ts', 'lib/auth.ts', 'lib/repository.ts', 'lib/actions.ts']
          : []),
      ],
      thresholds: { lines: 80, functions: 80, 'lib/logic/**': { lines: 90, functions: 90 } },
    },
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['lib/**/*.test.ts', 'tests/e2e/reporters/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'components',
          environment: 'jsdom',
          setupFiles: ['./tests/setup.ts'],
          include: ['features/**/*.test.tsx'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
});
