import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/*
  Scroll-reveal for the landing sections. Each element marked [data-reveal]
  fades and rises once as it scrolls into view. Motion here is a nicety, never
  load-bearing: if the visitor prefers reduced motion we leave everything
  visible and skip GSAP entirely. GSAP lives only in the landing chunk (this
  feature is lazy-loaded), so it never ships to the app routes.

  Correctness notes:
  - We animate with `gsap.to` from an explicit hidden state (`autoAlpha: 0`)
    rather than `gsap.from`. `gsap.from` can leave an element stuck invisible
    if its ScrollTrigger is torn down mid-flight (which StrictMode's
    double-invoke of effects makes easy to hit in dev). `autoAlpha` also flips
    `visibility`, so a hidden element is never focusable/read while transparent.
  - Everything is created inside a `gsap.context` scoped to the container and
    reverted on cleanup, which fully restores the DOM (no stuck opacity) between
    mounts and navigations.
  - The whole setup is wrapped so a GSAP failure can never blank the page; on
    error we clear inline styles and leave the content visible.

  Returns a ref to attach to the scope container.
*/
export function useLandingReveal<T extends HTMLElement>() {
  const scopeRef = useRef<T>(null);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    let ctx: gsap.Context | undefined;
    try {
      ctx = gsap.context(() => {
        const targets = gsap.utils.toArray<HTMLElement>("[data-reveal]");
        targets.forEach((el) => {
          gsap.set(el, { autoAlpha: 0, y: 24 });
          gsap.to(el, {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              once: true,
            },
          });
        });
      }, scope);
    } catch {
      // Motion is optional. If GSAP fails, make sure nothing is left hidden.
      scope
        .querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((el) => el.removeAttribute("style"));
    }

    return () => ctx?.revert();
  }, []);

  return scopeRef;
}
