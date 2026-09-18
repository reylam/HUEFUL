import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import gsap from "gsap";

export interface TabItem {
  /** Stable id, also used as the tab's value. */
  id: string;
  /** Short label shown in the tab strip. */
  label: string;
  /** Panel content for this tab. */
  content: ReactNode;
}

interface AnimatedTabsProps {
  items: TabItem[];
  /** Accessible name for the tab strip. */
  label: string;
  /** Which tab starts active. Defaults to the first. */
  defaultId?: string;
  className?: string;
}

/*
  An animated tab switcher in the spirit of the 21st.dev "animated tabs" and the
  feature-11 pattern: a pill-style tab strip with an indicator that slides to
  the active tab, and panels that cross-fade in on switch.

  Ported to our stack rather than pasted:
  - Motion is GSAP (already on the landing), not framer-motion, which this
    project deliberately does not ship. The sliding pill and the panel fade are
    both GSAP tweens.
  - Styled with our design tokens (surface, border, primary), not a demo theme.
  - Real tablist semantics: role="tablist"/"tab"/"tabpanel", aria-selected,
    roving tabindex, and arrow-key + Home/End navigation, so it works for
    keyboard and screen-reader users, not just mouse.
  - Reduced-motion safe: when the visitor prefers reduced motion we still move
    the indicator and swap panels, we just do it instantly with no tweened
    slide or fade. Nothing here is load-bearing motion.
  - Fails safe: if GSAP throws, we fall back to the same instant state change,
    so the tabs always work.
*/
export function AnimatedTabs({
  items,
  label,
  defaultId,
  className,
}: AnimatedTabsProps) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(defaultId ?? items[0]?.id);
  const activeIndex = Math.max(
    0,
    items.findIndex((t) => t.id === activeId),
  );

  const stripRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const prefersReduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Position the sliding indicator under the active tab. useLayoutEffect so the
  // indicator is placed before paint (no first-frame flash), and we re-run on
  // resize since tab widths are content-driven.
  useLayoutEffect(() => {
    const strip = stripRef.current;
    const indicator = indicatorRef.current;
    const activeTab = tabRefs.current[activeIndex];
    if (!strip || !indicator || !activeTab) return;

    const place = () => {
      const stripRect = strip.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      const left = tabRect.left - stripRect.left;
      const width = tabRect.width;

      if (prefersReduced()) {
        gsap.set(indicator, { x: left, width });
        return;
      }
      try {
        gsap.to(indicator, {
          x: left,
          width,
          duration: 0.35,
          ease: "power3.out",
        });
      } catch {
        gsap.set(indicator, { x: left, width });
      }
    };

    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [activeIndex]);

  // Cross-fade the active panel on switch.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (prefersReduced()) return;
    try {
      gsap.fromTo(
        panel,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" },
      );
    } catch {
      panel.style.opacity = "1";
    }
  }, [activeId]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const count = items.length;
    let next = activeIndex;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (activeIndex + 1) % count;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (activeIndex - 1 + count) % count;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    else return;

    e.preventDefault();
    setActiveId(items[next].id);
    tabRefs.current[next]?.focus();
  }

  if (items.length === 0) return null;

  return (
    <div className={className}>
      <div
        ref={stripRef}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="relative inline-flex flex-wrap gap-1 rounded-full border border-border bg-surface-raised p-1"
      >
        {/* Sliding indicator sits behind the labels. */}
        <span
          ref={indicatorRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-1 bottom-1 rounded-full bg-primary"
        />
        {items.map((tab, i) => {
          const selected = tab.id === activeId;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              className={[
                "relative z-10 min-h-9 rounded-full px-4 text-sm font-semibold transition-colors",
                selected
                  ? "text-primary-foreground"
                  : "text-text-muted hover:text-text",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {items.map((tab) => {
          const selected = tab.id === activeId;
          return (
            <div
              key={tab.id}
              ref={selected ? panelRef : undefined}
              role="tabpanel"
              id={`${baseId}-panel-${tab.id}`}
              aria-labelledby={`${baseId}-tab-${tab.id}`}
              hidden={!selected}
              tabIndex={0}
            >
              {selected ? tab.content : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
