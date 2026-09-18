import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface CountUpProps {
  /** Target value to count up to. */
  to: number;
  /** Text before the number (e.g. "1 in "). */
  prefix?: string;
  /** Text after the number (e.g. "%", "+"). */
  suffix?: string;
  /** Decimal places to show. Defaults to 0. */
  decimals?: number;
  className?: string;
}

/*
  A number that counts up from zero to its target the first time it scrolls into
  view. A small, satisfying flourish for stat strips.

  Motion is GSAP + ScrollTrigger. Reduced-motion visitors see the final number
  immediately (no count), and it fails safe: on a GSAP error the final value is
  written straight in. The full "prefix + value + suffix" is exposed to
  assistive tech via aria-label so a screen reader announces the real figure,
  not the intermediate ticks.
*/
export function CountUp({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  const format = (n: number) =>
    `${prefix}${n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      el.textContent = format(to);
      return;
    }

    let ctx: gsap.Context | undefined;
    try {
      ctx = gsap.context(() => {
        const counter = { value: 0 };
        el.textContent = format(0);
        gsap.to(counter, {
          value: to,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = format(counter.value);
          },
        });
      }, el);
    } catch {
      el.textContent = format(to);
    }

    return () => ctx?.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, prefix, suffix, decimals]);

  return (
    <span ref={ref} className={className} aria-label={format(to)}>
      {format(to)}
    </span>
  );
}
