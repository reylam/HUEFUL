import { useEffect, useRef } from "react";
import type { ComponentType } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight, Grid2x2, X, Home, Settings } from "lucide-react";
import { lenses } from "@/app/lenses";
import { useAuth } from "@/stores/auth";
import { levelFromXp, levelTitle, useProgress } from "@/stores/progress";
import logoText from "@/assets/images/logo_text.png";

/*
  One nav, two shapes, mobile-first, then use the extra room:
  - phones: a bottom tab bar in the thumb zone (<DashboardBottomNav/>). To keep
    it thumb-friendly we surface the primary destinations only; the rest live on
    the dashboard home and in the desktop rail.
  - md and up: a vertical side rail (<DashboardSideNav/>), because a bottom bar
    is a phone pattern and forcing it onto a wide screen is an anti-pattern. The
    rail sticks to the top of the viewport so every tool stays one click away on
    long pages. It needs self-start and an explicit height as well as sticky: a
    stretched flex item is already as tall as its container, so it has nothing
    to stick within. It scrolls internally if its own items outgrow the screen
    (the larger-text preference can cause that).

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
  /** Show in the compact mobile bottom bar; the rest live in the More sheet. */
  primary: boolean;
  /** One line shown under the label in the More sheet. */
  summary?: string;
}

const primaryPaths = new Set(["scan", "compare", "outfit"]);

const items: NavItem[] = [
  { to: "/dashboard", label: "Home", navLabel: "Home", Icon: Home, primary: true },
  ...lenses.map((lens) => ({
    to: `/dashboard/${lens.path}`,
    label: lens.label,
    navLabel: lens.navLabel,
    Icon: lens.Icon,
    primary: primaryPaths.has(lens.path),
    summary: lens.summary,
  })),
  {
    to: "/dashboard/settings",
    label: "Settings",
    navLabel: "Settings",
    Icon: Settings,
    primary: false,
    summary: "Theme, text size, motion, and your vision profile.",
  },
];

/*
  Mobile bottom nav: a bar docked to the bottom edge with gently rounded top
  corners, so it reads as a panel rising from the bottom. Four primary
  destinations plus "More", which opens a bottom sheet holding every other
  destination, so each tool is at most two taps away from anywhere (before,
  Ripeness, Simulator and Saved were only reachable via the home screen).

  Each item is an icon + label; the active one is marked with a top bar +
  weight (never color alone). "More" shows as active while you are on one of
  the destinations it holds. The bar respects the home-indicator safe area.
*/
const tabClass = (isActive: boolean) =>
  [
    "group flex min-h-14 w-full flex-col items-center justify-center gap-1 py-2 text-xs",
    "border-t-2 transition-colors active:scale-95 motion-reduce:active:scale-100",
    isActive
      ? "border-primary font-semibold text-text"
      : "border-transparent font-medium text-text-muted",
  ].join(" ");

const tabIconClass = (isActive: boolean) =>
  [
    "transition-transform duration-200 motion-reduce:transition-none",
    isActive ? "-translate-y-0.5 scale-110 text-primary" : "",
  ].join(" ");

export function DashboardBottomNav() {
  const { pathname } = useLocation();
  const sheetRef = useRef<HTMLDialogElement>(null);
  const barItems = items.filter((i) => i.primary);
  const moreItems = items.filter((i) => !i.primary);
  const moreActive = moreItems.some((i) => pathname.startsWith(i.to));

  // Navigating (from the sheet or anywhere else) always dismisses the sheet.
  useEffect(() => {
    sheetRef.current?.close();
  }, [pathname]);

  return (
    <>
      <nav
        aria-label="Primary"
        className="sticky bottom-0 z-20 rounded-t-2xl border-t border-border bg-surface-raised/95 pb-[env(safe-area-inset-bottom)] shadow-float backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {barItems.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) => tabClass(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <item.Icon size={22} aria-hidden className={tabIconClass(isActive)} />
                    <span>{item.navLabel}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li className="flex-1">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-current={moreActive ? "page" : undefined}
              onClick={() => sheetRef.current?.showModal()}
              className={tabClass(moreActive)}
            >
              <Grid2x2 size={22} aria-hidden className={tabIconClass(moreActive)} />
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      {/*
        Native modal <dialog>: focus is trapped inside and restored on close,
        Esc closes it, and the page behind is inert. Tapping the dimmed
        backdrop (the dialog element itself, outside the panel) closes it too.
      */}
      <dialog
        ref={sheetRef}
        aria-labelledby="more-sheet-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="sheet mb-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-3xl border-t border-border bg-surface-raised p-0 text-text backdrop:bg-[#0c2340]/40 md:hidden"
      >
        <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
          {/* Grab handle: a familiar "this is a sheet" cue; decorative. */}
          <span aria-hidden className="mx-auto mb-2 block h-1 w-10 rounded-full bg-border" />
          <div className="flex items-center justify-between pb-2">
            <h2 id="more-sheet-title" className="text-lg font-semibold">
              More
            </h2>
            <button
              type="button"
              onClick={() => sheetRef.current?.close()}
              aria-label="Close"
              className="grid h-11 w-11 place-items-center rounded-full text-text-muted hover:bg-surface-sunken hover:text-text"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {moreItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "flex min-h-14 items-center gap-3 rounded-2xl border-l-2 px-3 py-2.5 transition-colors",
                      isActive
                        ? "border-primary bg-surface"
                        : "border-transparent hover:bg-surface active:bg-surface-sunken",
                    ].join(" ")
                  }
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-sunken text-primary">
                    <item.Icon size={20} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{item.label}</span>
                    {item.summary && (
                      <span className="line-clamp-1 text-sm text-text-muted">
                        {item.summary}
                      </span>
                    )}
                  </span>
                  <ChevronRight size={18} aria-hidden className="shrink-0 text-text-muted" />
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}

/*
  A single side-rail item. The active state is carried three ways so it never
  depends on color: a filled pill, a left accent bar, and a tinted icon chip,
  plus heavier text. Hover lifts the icon chip and label a touch. The chip gives
  each icon a consistent, framed home so the rail reads as a considered set
  rather than loose glyphs.
*/
function SideNavItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/dashboard"}
      className={({ isActive }) =>
        [
          "group relative flex min-h-11 items-center gap-3 rounded-xl py-2 pl-3 pr-2 text-sm transition-colors",
          isActive
            ? "bg-surface font-semibold text-text"
            : "font-medium text-text-muted hover:bg-surface hover:text-text",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {/* Left accent bar: a non-color cue, present only when active. */}
          <span
            aria-hidden
            className={[
              "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
              isActive ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />
          <span
            aria-hidden
            className={[
              "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-surface-sunken text-text-muted group-hover:text-primary",
            ].join(" ")}
          >
            <item.Icon size={18} />
          </span>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          <ChevronRight
            size={16}
            aria-hidden
            className={[
              "shrink-0 transition-all",
              isActive
                ? "text-primary opacity-100"
                : "text-text-muted opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100",
            ].join(" ")}
          />
        </>
      )}
    </NavLink>
  );
}

export function DashboardSideNav() {
  const homeItem = items[0];
  const toolItems = items.filter(
    (i) => i.to !== "/dashboard" && i.to !== "/dashboard/settings",
  );
  const settingsItem = items.find((i) => i.to === "/dashboard/settings");

  const name = useAuth((s) => s.user?.name);
  const xp = useProgress((s) => s.xp);
  const { level, intoLevel, levelSpan } = levelFromXp(xp);
  const pct = Math.round((intoLevel / levelSpan) * 100);

  return (
    <nav
      aria-label="Sections"
      className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface-raised px-3 py-5 md:sticky md:top-0 md:flex md:h-dvh md:self-start md:overflow-y-auto"
    >
      <NavLink
        to="/"
        className="flex items-center rounded-lg px-3 pb-5 pt-1"
        aria-label="HUEFUL home"
      >
        <img
          src={logoText}
          alt="HUEFUL"
          width={360}
          height={120}
          className="brand-logo h-8 w-auto"
        />
      </NavLink>

      <ul className="flex flex-col gap-1">
        <li>
          <SideNavItem item={homeItem} />
        </li>
      </ul>

      {/* Tools group: a quiet label gives the rail hierarchy instead of one
          long undifferentiated list. */}
      <p className="px-3 pb-1.5 pt-5 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Tools
      </p>
      <ul className="flex flex-col gap-1">
        {toolItems.map((item) => (
          <li key={item.to}>
            <SideNavItem item={item} />
          </li>
        ))}
      </ul>

      {/* Settings + a level footer pinned to the bottom, so the rail has a base
          and the progress system has a persistent, quiet home. */}
      <div className="mt-auto flex flex-col gap-3 pt-6">
        {settingsItem && (
          <ul>
            <li>
              <SideNavItem item={settingsItem} />
            </li>
          </ul>
        )}

        <div className="rounded-2xl border border-border bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-text">
              {name ? name : "Guest"}
            </span>
            <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-semibold text-text-muted">
              Lv {level}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">{levelTitle(level)}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
