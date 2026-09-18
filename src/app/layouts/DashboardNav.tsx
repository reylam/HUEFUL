import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  ScanLine,
  GitCompare,
  Shirt,
  Apple,
  Eye,
  Bookmark,
  Settings,
} from "lucide-react";
import { lenses } from "@/app/lenses";
import logoText from "@/assets/images/logo_text.png";

/*
  One nav, two shapes, mobile-first, then use the extra room:
  - phones: a bottom tab bar in the thumb zone (<DashboardBottomNav/>). To keep
    it thumb-friendly we surface the primary destinations only; the rest live on
    the dashboard home and in the desktop rail.
  - md and up: a vertical side rail (<DashboardSideNav/>), because a bottom bar
    is a phone pattern and forcing it onto a wide screen is an anti-pattern.

  Every item carries an icon AND a text label, and the active state uses a bar +
  weight, never color alone. Icons come from lucide so the set stays consistent.
*/

type IconType = ComponentType<{
  size?: number;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
  className?: string;
}>;

interface NavItem {
  to: string;
  label: string;
  navLabel: string;
  Icon: IconType;
  /** Show in the compact mobile bottom bar. */
  primary: boolean;
}

const lensIcons: Record<string, IconType> = {
  scan: ScanLine,
  compare: GitCompare,
  outfit: Shirt,
  ripeness: Apple,
  simulate: Eye,
  saved: Bookmark,
};

const primaryPaths = new Set(["scan", "compare", "outfit"]);

const items: NavItem[] = [
  { to: "/dashboard", label: "Home", navLabel: "Home", Icon: Home, primary: true },
  ...lenses.map((lens) => ({
    to: `/dashboard/${lens.path}`,
    label: lens.label,
    navLabel: lens.navLabel,
    Icon: lensIcons[lens.path] ?? ScanLine,
    primary: primaryPaths.has(lens.path),
  })),
  {
    to: "/dashboard/settings",
    label: "Settings",
    navLabel: "Settings",
    Icon: Settings,
    primary: true,
  },
];

/*
  Mobile bottom nav: a plain bar docked to the bottom edge, full width, squared
  except for gently rounded top-left and top-right corners so it reads as a
  panel rising from the bottom. Each item is an icon + label; the active one is
  marked with a top bar + weight (never color alone). It respects the phone's
  home-indicator safe area.
*/
export function DashboardBottomNav() {
  const barItems = items.filter((i) => i.primary);
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-20 rounded-t-2xl border-t border-border bg-surface-raised pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {barItems.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                [
                  "group flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-xs font-medium",
                  "border-t-2 transition-colors active:scale-95 motion-reduce:active:scale-100",
                  isActive
                    ? "border-primary text-text"
                    : "border-transparent text-text-muted",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <item.Icon
                    size={22}
                    aria-hidden
                    className={[
                      "transition-transform duration-200 motion-reduce:transition-none",
                      isActive ? "-translate-y-0.5 scale-110" : "",
                    ].join(" ")}
                  />
                  <span>{item.navLabel}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DashboardSideNav() {
  return (
    <nav
      aria-label="Sections"
      className="hidden w-60 shrink-0 border-r border-border bg-surface-raised px-3 py-6 md:block"
    >
      <NavLink
        to="/"
        className="flex items-center px-3 pb-6"
        aria-label="HUEFUL home"
      >
        <img
          src={logoText}
          alt="HUEFUL"
          width={360}
          height={120}
          className="h-8 w-auto"
        />
      </NavLink>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                [
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium",
                  "border-l-2 transition-colors",
                  isActive
                    ? "border-primary bg-surface text-text"
                    : "border-transparent text-text-muted hover:bg-surface",
                ].join(" ")
              }
            >
              <item.Icon size={20} aria-hidden />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
