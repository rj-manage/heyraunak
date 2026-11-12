import Link from "next/link";

// Design-faithful 404 for the application routes. The public site keeps its
// own /404.html for the static pages.
export default function NotFound() {
  return (
    <main className="auth-wrap">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="kicker">Error 404</div>
        <h1>That page has wandered off.</h1>
        <p className="muted">
          The link may be old, or the page may have moved. Head back to the studio.
        </p>
        <div className="auth-actions">
          <Link className="soft-btn" href="/">
            Back to home
          </Link>
          <Link className="soft-btn ghost" href="/services/">
            Browse services
          </Link>
        </div>
      </div>
    </main>
  );
}
