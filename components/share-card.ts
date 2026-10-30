/**
 * Draws the shareable image: a white card with the page owner, the QR code with a generous quiet
 * zone, and the address. Browser-only (uses canvas). Black on white keeps the code scannable
 * in print and on any screen, regardless of the app's theme.
 */
const W = 1080;
const H = 1350;
const FONT = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Arial, sans-serif';

function fit(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  size: number,
  maxWidth: number,
) {
  let px = size;
  ctx.font = `${weight} ${px}px ${FONT}`;
  while (ctx.measureText(text).width > maxWidth && px > 28) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${FONT}`;
  }
  if (ctx.measureText(text).width > maxWidth) {
    let clipped = text;
    while (clipped.length > 1 && ctx.measureText(clipped + '…').width > maxWidth)
      clipped = clipped.slice(0, -1);
    return clipped + '…';
  }
  return text;
}

export async function renderShareCard(
  qr: HTMLCanvasElement,
  { name, address }: { name: string; address: string },
): Promise<Blob> {
  try {
    await Promise.all([
      document.fonts.load(`600 56px ${FONT}`),
      document.fonts.load(`400 36px ${FONT}`),
    ]);
  } catch {
    /* fall back to the system font */
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#1c1917';
  const title = fit(ctx, name || 'My Linkhouse', 600, 64, W - 160);
  ctx.fillText(title, W / 2, 190);

  ctx.fillStyle = '#66605a';
  ctx.fillText(fit(ctx, address, 400, 38, W - 160), W / 2, 252);

  const size = 720;
  const x = (W - size) / 2;
  const y = 330;
  ctx.imageSmoothingEnabled = false; // keep module edges crisp
  ctx.drawImage(qr, x, y, size, size);

  ctx.fillStyle = '#1c1917';
  ctx.font = `600 44px ${FONT}`;
  ctx.fillText('Scan to visit my page', W / 2, y + size + 110);

  ctx.fillStyle = '#4f46e5';
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText('linkhouse.', W / 2, H - 80);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image'))),
      'image/png',
    ),
  );
}
