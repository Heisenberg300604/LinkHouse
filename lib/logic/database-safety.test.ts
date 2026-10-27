import { it, expect } from 'vitest';
import { assertTestDatabase } from './database-safety';
it('rejects the development database including pooled aliases', () =>
  expect(() =>
    assertTestDatabase(
      'postgres://u:p@ep-main-pooler.neon.tech/neondb',
      'postgres://other:pass@ep-main.neon.tech/neondb?sslmode=require',
    ),
  ).toThrow());
it('allows a separate test branch', () =>
  expect(() =>
    assertTestDatabase(
      'postgres://u:p@ep-test.neon.tech/neondb',
      'postgres://u:p@ep-main.neon.tech/neondb',
    ),
  ).not.toThrow());
it('allows a separate database on the same server', () =>
  expect(() =>
    assertTestDatabase('postgres://u:p@localhost/test', 'postgres://u:p@localhost/dev'),
  ).not.toThrow());
it('rejects non Postgres test URLs', () =>
  expect(() => assertTestDatabase('file:test.db')).toThrow());
