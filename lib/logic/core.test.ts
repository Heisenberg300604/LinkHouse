import { describe, it, expect } from 'vitest';
import {
  normalizeUrl,
  usernameSchema,
  linkSchema,
  sectionSchema,
  profileSchema,
  platformIcon,
  reorder,
  checkLimit,
} from './core';
describe('URL normalization', () => {
  it.each([
    'javascript:alert(1)',
    'data:text/html,x',
    'ftp://host.com',
    '',
    'not a url',
    'https://',
    'https://user:pass@example.com',
  ])('rejects unsafe or malformed URL %s', (s) => expect(() => normalizeUrl(s)).toThrow());
  it.each([
    ['example.com', 'https://example.com/'],
    [' https://example.com/a ', 'https://example.com/a'],
    ['http://localhost:3000', 'http://localhost:3000/'],
  ])('normalizes %s', (a, b) => expect(normalizeUrl(a)).toBe(b));
});
describe('usernames', () => {
  it.each([
    'ab',
    'a'.repeat(31),
    'admin',
    'api',
    'dashboard',
    'sign-in',
    'sign-up',
    'onboarding',
    'settings',
    'about',
    'r',
    'runs',
    'Upper',
    'a b',
    'a!b',
    '',
  ])('rejects %s', (s) => expect(usernameSchema.safeParse(s).success).toBe(false));
  it.each(['abc', 'a'.repeat(30), 'my-name_23'])('accepts %s', (s) =>
    expect(usernameSchema.safeParse(s).success).toBe(true),
  );
});
describe('field boundaries', () => {
  it('rejects empty titles', () =>
    expect(linkSchema.safeParse({ title: ' ', url: 'example.com' }).success).toBe(false));
  it('accepts emoji and normalizes URLs', () =>
    expect(linkSchema.parse({ title: 'Hello 🌱', url: 'example.com' }).url).toBe(
      'https://example.com/',
    ));
  it('rejects oversized link title', () =>
    expect(linkSchema.safeParse({ title: 'a'.repeat(101), url: 'example.com' }).success).toBe(
      false,
    ));
  it('rejects empty section', () =>
    expect(sectionSchema.safeParse({ title: '' }).success).toBe(false));
  it('accepts 160 bio characters', () =>
    expect(
      profileSchema.safeParse({
        username: 'abc',
        displayName: 'A',
        bio: 'a'.repeat(160),
        avatarUrl: '',
      }).success,
    ).toBe(true));
  it('rejects 161 bio characters', () =>
    expect(
      profileSchema.safeParse({
        username: 'abc',
        displayName: 'A',
        bio: 'a'.repeat(161),
        avatarUrl: '',
      }).success,
    ).toBe(false));
  it('rejects invalid avatar', () =>
    expect(
      profileSchema.safeParse({ username: 'abc', displayName: 'A', bio: '', avatarUrl: 'data:abc' })
        .success,
    ).toBe(false));
});
describe('platform icons', () => {
  it.each([
    ['youtube.com', 'youtube'],
    ['youtu.be', 'youtube'],
    ['x.com', 'twitter'],
    ['twitter.com', 'twitter'],
    ['instagram.com', 'instagram'],
    ['linkedin.com', 'linkedin'],
    ['github.com', 'github'],
    ['example.com', 'link'],
    ['youtube.com.evil.com', 'link'],
    ['bad url', 'link'],
  ])('detects %s', (url, icon) => expect(platformIcon(url)).toBe(icon));
});
describe('ordering and limits', () => {
  it('moves IDs without mutation', () => {
    const ids = ['a', 'b', 'c'];
    expect(reorder(ids, 'a', 'c')).toEqual(['b', 'c', 'a']);
    expect(ids).toEqual(['a', 'b', 'c']);
  });
  it('rejects foreign IDs', () => expect(() => reorder(['a'], 'other', 'a')).toThrow());
  it('rejects duplicate IDs', () => expect(() => reorder(['a', 'a'], 'a', 'a')).toThrow());
  it.each([
    ['links', 200],
    ['sections', 30],
  ] as const)('enforces %s limit', (kind, max) => {
    expect(() => checkLimit(max - 1, kind)).not.toThrow();
    expect(() => checkLimit(max, kind)).toThrow();
  });
});
