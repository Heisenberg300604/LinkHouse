'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="auth-page">
      <h1>Something didn’t load.</h1>
      <p>Please try again in a moment.</p>
      <button className="primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
