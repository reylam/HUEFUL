import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/stores/auth";

function RouteFallback() {
  return (
    <div
      role="status"
      className="flex min-h-[50vh] items-center justify-center text-text-muted"
    >
      Loading…
    </div>
  );
}

/*
  Public shell for the landing and auth pages. A plain top bar and footer, no
  app chrome. This is the marketing/entry zone, kept deliberately light. If a
  session already exists we still show the marketing pages (the user asked that
  "/" never auto-redirect to the dashboard); the top bar just offers a way in.
*/
export function PublicLayout() {
  const user = useAuth((s) => s.user);

  return (
    <div className="flex min-h-full flex-col bg-surface">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-20 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="text-base font-bold tracking-tight text-text">
            all_eyes
          </Link>
          <nav aria-label="Account" className="flex items-center gap-1 text-sm">
            {user ? (
              <NavLink
                to="/dashboard"
                className="rounded-lg px-3 py-2 font-semibold text-primary-foreground bg-primary hover:brightness-110"
              >
                Open app
              </NavLink>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="rounded-lg px-3 py-2 font-medium text-text-muted hover:text-text"
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-lg bg-primary px-3 py-2 font-semibold text-primary-foreground hover:brightness-110"
                >
                  Get started
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-sm text-text-muted md:px-6">
          <p className="font-semibold text-text">all_eyes</p>
          <p>A color assistant built for people with color vision deficiency.</p>
        </div>
      </footer>
    </div>
  );
}
