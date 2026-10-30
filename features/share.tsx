'use client';
import { useRef, useState, useSyncExternalStore } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Download, MessageCircle, QrCode, Share2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { renderShareCard } from '@/components/share-card';
import {
  isLocalAddress,
  publicPageUrl,
  qrFileName,
  resolveOrigin,
  shareText,
  whatsappUrl,
} from '@/lib/logic/share';

const subscribeNoop = () => () => {};

/** True when the browser can hand an image file to the system share sheet (most phones). */
function supportsFileSharing() {
  try {
    return (
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File([''], 'qr.png', { type: 'image/png' })] })
    );
  } catch {
    return false;
  }
}

function save(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export function ShareButton({
  username,
  displayName,
  variant = 'secondary',
}: {
  username: string;
  displayName: string;
  variant?: 'secondary' | 'ghost';
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)}>
        <QrCode size={14} aria-hidden />
        Share
      </Button>
      {open && (
        <ShareDialog username={username} displayName={displayName} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

export function ShareDialog({
  username,
  displayName,
  onClose,
}: {
  username: string;
  displayName: string;
  onClose: () => void;
}) {
  const url = publicPageUrl(
    username,
    resolveOrigin(process.env.NEXT_PUBLIC_APP_URL, window.location.origin),
  );
  const label = displayName || username;
  const canShareImage = useSyncExternalStore(subscribeNoop, supportsFileSharing, () => false);
  const qrCanvas = useRef<HTMLCanvasElement>(null);
  const qrSvg = useRef<SVGSVGElement>(null);
  const [busy, setBusy] = useState<'png' | 'share' | null>(null);
  const [copied, setCopied] = useState(false);

  const makePng = () => {
    if (!qrCanvas.current) throw new Error('QR code is not ready');
    return renderShareCard(qrCanvas.current, { name: label, address: 'linkhouse/' + username });
  };

  async function downloadPng() {
    setBusy('png');
    try {
      save(await makePng(), qrFileName(username, 'png'));
    } catch {
      toast.error('Could not create the image. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  function downloadSvg() {
    const svg = qrSvg.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    save(
      new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }),
      qrFileName(username, 'svg'),
    );
  }

  async function shareImage() {
    setBusy('share');
    try {
      const file = new File([await makePng()], qrFileName(username, 'png'), { type: 'image/png' });
      await navigator.share({
        files: [file],
        title: label + ' on Linkhouse',
        text: shareText(label, url),
      });
    } catch (error) {
      // Dismissing the share sheet is not an error.
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        toast.error('Sharing was not possible. Try downloading the image instead.');
    } finally {
      setBusy(null);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Could not copy. Select the address and copy it manually.');
    }
  }

  return (
    <Dialog
      title="Share your page"
      description="Anyone who scans this code opens your public page. No link to send."
      onClose={onClose}
    >
      <div className="share-qr" role="img" aria-label={'QR code that opens ' + url}>
        <QRCodeSVG
          ref={qrSvg}
          value={url}
          size={216}
          level="Q"
          marginSize={4}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      {/* Offscreen canvas used only to render the downloadable image at full resolution. */}
      <QRCodeCanvas
        ref={qrCanvas}
        value={url}
        size={720}
        level="Q"
        marginSize={0}
        bgColor="#ffffff"
        fgColor="#000000"
        style={{ display: 'none' }}
      />
      <p className="share-name">
        <strong>{label}</strong>
        <span>linkhouse/{username}</span>
      </p>

      {isLocalAddress(url) && (
        <p className="notice" role="note">
          <TriangleAlert size={16} aria-hidden />
          <span>
            This code points to <b>{new URL(url).host}</b>, which only works on your own network.
            Set <code>NEXT_PUBLIC_APP_URL</code> to your real domain before sharing it.
          </span>
        </p>
      )}

      <div className="share-actions">
        {canShareImage && (
          <Button onClick={shareImage} loading={busy === 'share'} className="share-primary">
            <Share2 size={15} aria-hidden /> Share image
          </Button>
        )}
        <Button
          variant={canShareImage ? 'secondary' : 'primary'}
          onClick={downloadPng}
          loading={busy === 'png'}
          className={canShareImage ? undefined : 'share-primary'}
        >
          <Download size={15} aria-hidden /> Download PNG
        </Button>
        <Button variant="secondary" onClick={downloadSvg}>
          <Download size={15} aria-hidden /> Download SVG
        </Button>
        <Button variant="secondary" asChild>
          <a href={whatsappUrl(shareText(label, url))} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={15} aria-hidden /> WhatsApp link
          </a>
        </Button>
      </div>

      <div className="share-link">
        <input
          className="input"
          readOnly
          value={url}
          aria-label="Page address"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button variant="secondary" size="icon" onClick={copyLink} aria-label="Copy page address">
          {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        </Button>
      </div>
      <p className="hint share-hint">
        {canShareImage
          ? 'Share image opens your phone’s share sheet, including WhatsApp and Instagram.'
          : 'Download the image to post or print it. WhatsApp link shares the address as text.'}{' '}
        The code follows your current username, so reprint it if you change it.
      </p>
    </Dialog>
  );
}
