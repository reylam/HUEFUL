import { Link } from "react-router-dom";

/*
  Catch-all for unknown URLs. Kept plain and reassuring, with a clear way back
  to somewhere useful. Full-height centered so it doesn't look like a broken
  fragment of another page.
*/
export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
        Page not found
      </p>
      <h1 className="text-2xl font-bold text-text">
        We couldn't find that page
      </h1>
      <p className="max-w-sm text-text-muted">
        The link may be broken or the page may have moved.
      </p>
      <Link
        to="/"
        className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-6 font-semibold text-primary-foreground hover:brightness-110"
      >
        Back to home
      </Link>
    </div>
  );
}
