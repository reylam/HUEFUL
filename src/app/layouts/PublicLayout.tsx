import { lazy, Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/stores/auth";
import logoText from "@/assets/images/logo_text.png";

// Lazy so GSAP (its only heavy dependency) ships in the floating nav's own
// chunk instead of the main bundle.
const FloatingNav = lazy(() => import("@/shared/ui/FloatingNav"));

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

// Real page links shown in the center of the floating nav on wider screens.
// FloatingNav renders route paths as client-side NavLinks and "/#..." entries
// as plain anchors that jump within the landing.
const navLinks = [
  { label: "Features", href: "/features" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

/*
  Public shell for the landing and auth pages. The header is a rounded floating
  nav (ruixen-style) pinned to the top; there is no separate top bar. This is
  the marketing/entry zone. If a session already exists we still show the
  marketing pages (the user asked that "/" never auto-redirect to the
  dashboard); the nav just offers a way in.
*/
export function PublicLayout() {
  const user = useAuth((s) => s.user);

  return (
    <div className="flex min-h-full flex-col bg-surface">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-40 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Rounded floating nav, always present at the top. */}
      <Suspense fallback={null}>
        <FloatingNav
          links={navLinks}
          brand={
            <NavLink to="/" className="flex items-center" aria-label="HUEFUL home">
              <img
                src={logoText}
                alt="HUEFUL"
                width={360}
                height={120}
                className="h-7 w-auto"
              />
            </NavLink>
          }
          actions={
            user ? (
              <NavLink
                to="/dashboard"
                className="rounded-full bg-primary px-4 py-1.5 font-semibold text-primary-foreground hover:brightness-110"
              >
                Open app
              </NavLink>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="rounded-full px-3 py-1.5 font-medium text-text-muted hover:text-text"
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-full bg-primary px-4 py-1.5 font-semibold text-primary-foreground hover:brightness-110"
                >
                  Get started
                </NavLink>
              </>
            )
          }
        />
      </Suspense>

      {/* Padding-top clears the floating nav so content starts below it. */}
      <main id="main" className="flex-1 pt-20 md:pt-24">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 text-sm text-text-muted md:grid-cols-2 md:px-6">
          <div className="flex flex-col gap-2">
            <img
              src={logoText}
              alt="HUEFUL"
              width={360}
              height={120}
              className="h-7 w-auto self-start"
            />
            <p className="max-w-xs">
              A color assistant built for people with color vision deficiency.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-6 sm:grid-cols-3"
          >
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-text">Product</span>
              <Link to="/features" className="hover:text-text">
                Features
              </Link>
              <Link to="/faq" className="hover:text-text">
                FAQ
              </Link>
              <Link to="/dashboard" className="hover:text-text">
                Open app
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-text">Company</span>
              <Link to="/about" className="hover:text-text">
                About
              </Link>
              <Link to="/contact" className="hover:text-text">
                Contact
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-text">Account</span>
              <Link to="/login" className="hover:text-text">
                Log in
              </Link>
              <Link to="/register" className="hover:text-text">
                Get started
              </Link>
            </div>
          </nav>
        </div>
      </footer>
    </div>
  );
}
