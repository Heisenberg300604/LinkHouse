import { describe, it, expect } from 'vitest';
import {
  isLocalAddress,
  publicPageUrl,
  qrFileName,
  resolveOrigin,
  shareText,
  whatsappUrl,
} from './share';

describe('share helpers', () => {
  it('prefers a valid configured origin and strips paths', () => {
    expect(resolveOrigin('https://linkhouse.app/some/path', 'http://x.test')).toBe(
      'https://linkhouse.app',
    );
  });
  it('falls back when the configured origin is missing, malformed or not http(s)', () => {
    expect(resolveOrigin(undefined, 'http://localhost:3000/')).toBe('http://localhost:3000');
    expect(resolveOrigin('not a url', 'https://fallback.test')).toBe('https://fallback.test');
    expect(resolveOrigin('javascript:alert(1)', 'https://fallback.test')).toBe(
      'https://fallback.test',
    );
  });
  it('builds the public address without double slashes and encodes the username', () => {
    expect(publicPageUrl('alex', 'https://linkhouse.app/')).toBe('https://linkhouse.app/alex');
    expect(publicPageUrl('a/b', 'https://linkhouse.app')).toBe('https://linkhouse.app/a%2Fb');
  });
  it('detects addresses a phone cannot reach', () => {
    for (const url of [
      'http://localhost:3000/a',
      'http://127.0.0.1/a',
      'http://192.168.1.5:3000/a',
      'http://10.0.0.2/a',
      'http://172.20.1.1/a',
      'http://mac.local:3000/a',
    ])
      expect(isLocalAddress(url)).toBe(true);
    for (const url of ['https://linkhouse.app/a', 'http://172.32.0.1/a', 'nonsense'])
      expect(isLocalAddress(url)).toBe(false);
  });
  it('writes share text and a WhatsApp link that carry the address', () => {
    const text = shareText('Alex Morgan', 'https://linkhouse.app/alex');
    expect(text).toBe('Alex Morgan on Linkhouse: https://linkhouse.app/alex');
    expect(shareText('  ', 'https://x.test/a')).toBe('My Linkhouse: https://x.test/a');
    expect(whatsappUrl(text)).toBe('https://wa.me/?text=' + encodeURIComponent(text));
  });
  it('creates safe file names', () => {
    expect(qrFileName('alex_m-1', 'png')).toBe('linkhouse-alex_m-1-qr.png');
    expect(qrFileName('../evil', 'svg')).toBe('linkhouse-evil-qr.svg');
  });
});
