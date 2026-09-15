import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { lenses } from "@/app/lenses";
import { useAuth } from "@/stores/auth";
import { PageTransition } from "@/shared/ui/PageTransition";
import { DashboardBottomNav, DashboardSideNav } from "./DashboardNav";

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

function titleFor(pathname: string): string {
  if (pathname === "/dashboard" || pathname === "/dashboard/") return "Home";
  if (pathname === "/dashboard/settings") return "Settings";
  const segment = pathname.replace("/dashboard/", "");
  return lenses.find((l) => l.path === segment)?.label ?? "Dashboard";
}

/*
  The authenticated app shell. Mobile-first: single column with a bottom tab bar
  in the thumb zone; from md up, a side rail plus content capped at a readable
  measure (not locked to phone width, not stretched edge to edge).

  It also guards the zone: with no session we send the user to /login and
  remember where they were headed so login can return them.
*/
export function DashboardLayout() {
  const location = useLocation();
  const user = useAuth((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="flex min-h-full flex-col bg-surface md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-20 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <DashboardSideNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-baseline justify-between px-4 pb-2 pt-4 md:px-8 md:pt-6">
          <span className="text-sm font-semibold tracking-wide text-text-muted md:hidden">
            all_eyes
          </span>
          <h1 className="text-xl font-bold text-text md:text-2xl">
            {titleFor(location.pathname)}
          </h1>
        </header>

        <main id="main" className="flex-1 px-4 pb-4 md:px-8 md:pb-8">
          <div className="mx-auto w-full max-w-3xl">
            <Suspense fallback={<RouteFallback />}>
              <PageTransition routeKey={location.pathname}>
                <Outlet />
              </PageTransition>
            </Suspense>
          </div>
        </main>

        <DashboardBottomNav />
      </div>
    </div>
  );
}
