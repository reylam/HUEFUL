import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { lenses } from "@/app/lenses";
import { PageTransition } from "@/shared/ui/PageTransition";
import { DashboardBottomNav, DashboardSideNav } from "./DashboardNav";
import logoIcon from "@/assets/images/logo.png";

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
  The app shell. Mobile-first: single column with a bottom tab bar in the thumb
  zone; from md up, a side rail plus content capped at a readable measure (not
  locked to phone width, not stretched edge to edge).

  The zone is open: the dashboard and every lens are browsable without a
  session, so anyone can explore the tools. Sign-in only personalizes things
  (name, saved data); it is not a gate.
*/
export function DashboardLayout() {
  const location = useLocation();

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
        {/* The title shares the content column's measure, so both start on
            one left edge instead of the title hugging the rail. On phones it
            is a sticky, frosted app bar so you always know which tool you are
            in while scrolling; from md up the side rail carries that context. */}
        <header className="sticky top-0 z-20 border-b border-border bg-surface/85 px-4 py-3 backdrop-blur-md md:static md:border-0 md:bg-transparent md:px-8 md:pb-2 md:pt-6 md:backdrop-blur-none">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight text-text md:text-2xl">
              {titleFor(location.pathname)}
            </h1>
            <img
              src={logoIcon}
              alt="HUEFUL"
              width={135}
              height={128}
              className="brand-logo h-6 w-auto md:hidden"
            />
          </div>
        </header>

        <main id="main" className="flex-1 px-4 pb-6 pt-4 md:px-8 md:pb-8 md:pt-0">
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
