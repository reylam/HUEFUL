import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import gsap from "gsap";

export interface AccordionItem {
  id: string;
  question: string;
  answer: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  /** Allow more than one panel open at once. Defaults to single-open. */
  allowMultiple?: boolean;
  className?: string;
}

/*
  An accessible accordion with a smooth open/close. Each row is a disclosure
  button controlling a panel; single-open by default (opening one closes the
  rest), or allowMultiple to keep several open.

  The height animation is GSAP (auto height measured then tweened), the project's
  one animation stack. Reduced-motion visitors get an instant open/close (no
  height tween), and it fails safe: if GSAP throws, the panel is simply shown or
  hidden. Semantics follow the ARIA disclosure pattern: the button carries
  aria-expanded and aria-controls, the panel is aria-labelledby the button and
  hidden when closed, so it works for keyboard and screen reader users.
*/
export function Accordion({ items, allowMultiple = false, className }: AccordionProps) {
  const baseId = useId();
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}>
      {items.map((item) => (
        <AccordionRow
          key={item.id}
          item={item}
          baseId={baseId}
          isOpen={open.has(item.id)}
          onToggle={() => toggle(item.id)}
        />
      ))}
    </div>
  );
}

function AccordionRow({
  item,
  baseId,
  isOpen,
  onToggle,
}: {
  item: AccordionItem;
  baseId: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  // Whether the panel occupies layout. It stays true through the closing
  // animation so the collapse is visible, then flips false on complete.
  const [rendered, setRendered] = useState(isOpen);
  const first = useRef(true);

  useEffect(() => {
    const panel = panelRef.current;
    const inner = innerRef.current;
    if (!panel || !inner) return;

    // Skip animating the initial mount; just reflect the starting state.
    if (first.current) {
      first.current = false;
      panel.style.height = isOpen ? "auto" : "0px";
      setRendered(isOpen);
      return;
    }

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      panel.style.height = isOpen ? "auto" : "0px";
      setRendered(isOpen);
      return;
    }

    try {
      if (isOpen) {
        setRendered(true);
        const full = inner.offsetHeight;
        gsap.fromTo(
          panel,
          { height: 0 },
          {
            height: full,
            duration: 0.35,
            ease: "power2.out",
            onComplete: () => {
              panel.style.height = "auto";
            },
          },
        );
      } else {
        const full = inner.offsetHeight;
        gsap.fromTo(
          panel,
          { height: full },
          {
            height: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => setRendered(false),
          },
        );
      }
    } catch {
      panel.style.height = isOpen ? "auto" : "0px";
      setRendered(isOpen);
    }
  }, [isOpen]);

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface-raised">
      <h3>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={`${baseId}-panel-${item.id}`}
          id={`${baseId}-button-${item.id}`}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-base font-semibold text-text transition-colors hover:bg-surface"
        >
          <span>{item.question}</span>
          <ChevronDown
            size={20}
            aria-hidden
            className={[
              "shrink-0 text-text-muted transition-transform duration-300",
              isOpen ? "rotate-180" : "rotate-0",
            ].join(" ")}
          />
        </button>
      </h3>
      <div
        ref={panelRef}
        id={`${baseId}-panel-${item.id}`}
        role="region"
        aria-labelledby={`${baseId}-button-${item.id}`}
        hidden={!isOpen && !rendered}
        className="overflow-hidden"
        style={{ height: isOpen ? "auto" : 0 }}
      >
        <div ref={innerRef} className="px-4 pb-4 text-text-muted">
          {item.answer}
        </div>
      </div>
    </div>
  );
}
