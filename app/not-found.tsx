import NextLink from 'next/link';
export default function NotFound() {
  return (
    <main className="auth-page">
      <p className="eyebrow">404</p>
      <h1>This page hasn’t found its home.</h1>
      <p>Check the address, or start fresh.</p>
      <NextLink className="primary" href="/">
        Back to Linkhouse
      </NextLink>
    </main>
  );
}
