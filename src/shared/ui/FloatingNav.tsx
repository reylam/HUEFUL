import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import gsap from "gsap";

export interface FloatingNavLink {
  label: string;
  /** In-page anchor (e.g. "#how" or "/#how") or a client route path ("/about"). */
  href: string;
}

// An in-page anchor jump vs a real route. Anchors keep a plain <a> (native jump
// + scroll-padding); route paths use NavLink for client-side navigation.
function isAnchor(href: string): boolean {
  return href.startsWith("#") || href.includes("/#");
}

const linkClass =
  "rounded-full px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface hover:text-text";

interface FloatingNavProps {
  /** Brand mark shown on the left of the pill (usually the logo link). */
  brand: ReactNode;
  /** Account actions shown on the right (log in / get started, or open app). */
  actions: ReactNode;
  /** Optional inline links shown in the center on wider screens. */
  links?: FloatingNavLink[];
}

/*
  A nav with two synced states that morph into each other on scroll:

  - At the very top (default): a full-width, squared bar flush to the edges with
    a solid surface-raised background and just a bottom border, like a classic
    header.
  - Once the visitor scrolls down: it detaches into a centered, rounded,
    blurred, shadowed pill (the ruixen.ui "floating-nav" look).

  The morph is CSS transitions on max-width, radius, padding, background and
  shadow, driven by a single data-floating flag. Both max-width values are
  explicit lengths (100vw at the top, 48rem floating) so the width eases rather
  than snapping the way `max-width: none` would. The bar spans the full viewport
  at the top while an inner row keeps content at a readable, centered measure. GSAP only does the one-time
  drop-in on mount. It is reduced-motion friendly (motion-reduce disables the
  transitions) and fails safe (on a GSAP error we clear inline styles so the nav
  is always visible and usable).
*/
export function FloatingNav({ brand, actions, links }: FloatingNavProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const el = navRef.current;
    if (!wrap || !el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let ctx: gsap.Context | undefined;
    let raf = 0;
    let floating = false;

    const setFloating = (next: boolean) => {
      if (next === floating) return;
      floating = next;
      wrap.dataset.floating = next ? "true" : "false";
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        // A little past the top so the two states don't flicker at the boundary.
        setFloating(window.scrollY > 24);
      });
    };

    try {
      ctx = gsap.context(() => {
        if (!prefersReduced) {
          gsap.from(el, {
            y: -24,
            autoAlpha: 0,
            duration: 0.5,
            ease: "power3.out",
          });
        }
      }, el);
    } catch {
      el.removeAttribute("style");
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      ctx?.revert();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      data-floating="false"
      className={[
        "group pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center",
        "px-0 transition-[padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
        // When floating, inset from the edges and drop from the top.
        "data-[floating=true]:px-3 data-[floating=true]:pt-3",
      ].join(" ")}
    >
      <nav
        ref={navRef}
        aria-label="Primary"
        className={[
          "pointer-events-auto w-full border border-border backdrop-blur-md",
          // Only transition interpolatable properties: both max-width values are
          // explicit lengths (not `none`), so width eases instead of snapping.
          "transition-[max-width,border-radius,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
          // Default (top): the full viewport width, squared, solid.
          "max-w-[100vw] rounded-none bg-surface-raised shadow-none",
          // Floating: centered pill, rounded, translucent blur, shadow.
          // Driven by the wrapper's data-floating flag via the group.
          "group-data-[floating=true]:max-w-3xl group-data-[floating=true]:rounded-full",
          "group-data-[floating=true]:bg-surface-raised/80",
          "group-data-[floating=true]:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.6)]",
          "supports-[backdrop-filter]:group-data-[floating=true]:bg-surface-raised/70",
        ].join(" ")}
      >
        {/*
          Inner row: content stays capped to a readable measure and centered so
          it never sticks to the extreme edges of a full-width bar. When floating
          the padding tightens to fit the pill.
        */}
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 transition-[padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none group-data-[floating=true]:px-3">
          <div className="flex shrink-0 items-center pl-1">{brand}</div>

          {links && links.length > 0 && (
            <ul className="hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <li key={link.href}>
                  {isAnchor(link.href) ? (
                    <a href={link.href} className={linkClass}>
                      {link.label}
                    </a>
                  ) : (
                    <NavLink
                      to={link.href}
                      className={({ isActive }) =>
                        isActive
                          ? `${linkClass} bg-surface text-text`
                          : linkClass
                      }
                    >
                      {link.label}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="flex shrink-0 items-center gap-1 pr-0.5 text-sm">
            {actions}
          </div>
        </div>
      </nav>
    </div>
  );
}

// Default export so this can be React.lazy'd, which keeps GSAP out of the main
// bundle (it loads with the floating nav's own chunk on demand).
export default FloatingNav;
