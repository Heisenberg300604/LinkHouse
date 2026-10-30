import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareButton } from './share';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://linkhouse.app');
  // jsdom has no canvas; the QR canvas simply skips drawing.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function open() {
  const user = userEvent.setup();
  render(<ShareButton username="alex" displayName="Alex Morgan" />);
  await user.click(screen.getByRole('button', { name: 'Share' }));
  return user;
}

it('opens a dialog with a QR code for the public page address', async () => {
  await open();
  expect(screen.getByRole('dialog')).toHaveTextContent('Share your page');
  expect(
    screen.getByRole('img', { name: 'QR code that opens https://linkhouse.app/alex' }),
  ).toBeVisible();
  expect(screen.getByLabelText('Page address')).toHaveValue('https://linkhouse.app/alex');
});

it('offers the address on WhatsApp as text and a downloadable image', async () => {
  await open();
  const link = screen.getByRole('link', { name: /WhatsApp link/ });
  expect(link).toHaveAttribute(
    'href',
    'https://wa.me/?text=' +
      encodeURIComponent('Alex Morgan on Linkhouse: https://linkhouse.app/alex'),
  );
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect(screen.getByRole('button', { name: /Download PNG/ })).toBeEnabled();
  expect(screen.getByRole('button', { name: /Download SVG/ })).toBeEnabled();
});

it('hides "Share image" where the browser cannot share files', async () => {
  await open();
  expect(screen.queryByRole('button', { name: /Share image/ })).not.toBeInTheDocument();
});

it('shows "Share image" when the browser can share files', async () => {
  Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
  try {
    await open();
    expect(screen.getByRole('button', { name: /Share image/ })).toBeVisible();
  } finally {
    // @ts-expect-error restore jsdom's lack of the API
    delete navigator.canShare;
  }
});

it('warns when the address only works on this machine', async () => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
  await open();
  expect(screen.getByRole('note')).toHaveTextContent('only works on your own network');
});

it('does not warn for a public address and closes with Escape', async () => {
  const user = await open();
  expect(screen.queryByRole('note')).not.toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
