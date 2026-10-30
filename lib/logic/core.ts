import { z } from 'zod';
import { LINK_LIMIT, PROFILE_BIO_LIMIT, SECTION_LIMIT } from './limits';
const reserved = new Set([
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
  'favicon',
  'robots',
  'sitemap',
  'www',
  'support',
]);
export const usernameSchema = z
  .string()
  .min(3, 'Use at least 3 characters')
  .max(30, 'Use at most 30 characters')
  .regex(/^[a-z0-9_-]+$/, 'Use lowercase letters, numbers, underscores or hyphens')
  .refine((v) => !reserved.has(v), 'This username is reserved');
export function normalizeUrl(value: string): string {
  const input = value.trim();
  if (!input || /[\s\\\u0000-\u001f]/.test(input))
    throw new Error('Enter a valid http or https URL');
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(input);
  const url = new URL(hasScheme ? input : 'https://' + input);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    (!url.hostname.includes('.') && url.hostname !== 'localhost')
  )
    throw new Error('Enter a valid http or https URL');
  return url.href;
}
const urlSchema = z
  .string()
  .max(2048)
  .transform((value, ctx) => {
    try {
      return normalizeUrl(value);
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid http or https URL' });
      return z.NEVER;
    }
  });
export const linkSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100),
  url: urlSchema,
  description: z.string().trim().max(200).optional(),
  sectionId: z.string().min(1).nullable().optional(),
  icon: z.string().max(30).optional(),
});
export const sectionSchema = z.object({
  title: z.string().trim().min(1, 'Section name is required').max(60),
});
export const profileSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(80),
  bio: z
    .string()
    .max(PROFILE_BIO_LIMIT, 'Bio must be ' + PROFILE_BIO_LIMIT + ' characters or fewer'),
  avatarUrl: z.union([z.literal(''), urlSchema]),
});
export function platformIcon(value: string): string {
  try {
    const host = new URL(normalizeUrl(value)).hostname.replace(/^www\./, '');
    const domains: Record<string, string> = {
      'youtube.com': 'youtube',
      'youtu.be': 'youtube',
      'x.com': 'twitter',
      'twitter.com': 'twitter',
      'instagram.com': 'instagram',
      'linkedin.com': 'linkedin',
      'github.com': 'github',
    };
    return domains[host] ?? 'link';
  } catch {
    return 'link';
  }
}
export function reorder(ids: string[], active: string, over: string): string[] {
  if (new Set(ids).size !== ids.length || !ids.includes(active) || !ids.includes(over))
    throw new Error('Invalid order');
  const result = [...ids];
  result.splice(ids.indexOf(active), 1);
  result.splice(ids.indexOf(over), 0, active);
  return result;
}
export function checkLimit(count: number, kind: 'links' | 'sections'): void {
  const limit = kind === 'links' ? LINK_LIMIT : SECTION_LIMIT;
  if (count >= limit) throw new Error('You can have at most ' + limit + ' ' + kind);
}
