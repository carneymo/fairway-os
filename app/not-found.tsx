import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="shell error-page">
      <h1>That course is off the map.</h1>
      <p>The link may be incomplete or the listing may have changed.</p>
      <Link className="button" href="/">
        Find another place to play
      </Link>
    </main>
  );
}
