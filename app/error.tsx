'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="shell error-page">
      <h1>Let’s take another shot.</h1>
      <p>This page couldn’t load. Your next golf day is still out there.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
      <Link className="button outline" href="/">
        Back to your golf day
      </Link>
    </main>
  );
}
