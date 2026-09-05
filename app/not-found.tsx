/* oxlint-disable nextjs/no-html-link-for-pages -- Native document navigation avoids the beta client router that left deployed links inert. */
export default function NotFound() {
  return (
    <main className="shell error-page">
      <h1>That course is off the map.</h1>
      <p>The link may be incomplete or the listing may have changed.</p>
      <a className="button" href="/">
        Find another place to play
      </a>
    </main>
  );
}
