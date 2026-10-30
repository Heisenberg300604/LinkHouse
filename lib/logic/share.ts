/** Pure helpers for sharing a public page: the address, share text and file names. */

/**
 * The origin the QR code should point at. Prefers the configured canonical app URL so the code never
 * contains a preview or localhost address by accident; falls back to the current origin.
 */
export function resolveOrigin(configured: string | undefined, fallback: string): string {
  try {
    const url = new URL((configured ?? '').trim());
    if (['http:', 'https:'].includes(url.protocol)) return url.origin;
  } catch {}
  return fallback.replace(/\/+$/, '');
}

export function publicPageUrl(username: string, origin: string): string {
  return origin.replace(/\/+$/, '') + '/' + encodeURIComponent(username);
}

/** True when the address only works on this machine or network, so a phone cannot open it. */
export function isLocalAddress(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === 'localhost' ||
      hostname === '[::1]' ||
      hostname.endsWith('.local') ||
      /^127\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch {
    return false;
  }
}

export function shareText(displayName: string, url: string): string {
  return (displayName.trim() ? displayName.trim() + ' on Linkhouse' : 'My Linkhouse') + ': ' + url;
}

/** WhatsApp cannot attach an image from a link, so this shares the address as text. */
export function whatsappUrl(text: string): string {
  return 'https://wa.me/?text=' + encodeURIComponent(text);
}

export function qrFileName(username: string, extension: 'png' | 'svg'): string {
  return 'linkhouse-' + username.replace(/[^a-z0-9_-]/gi, '') + '-qr.' + extension;
}
