import type { ReactNode } from "react";

interface PageTransitionProps {
  /** Changes when the route changes, so the animation replays per page. */
  routeKey: string;
  children: ReactNode;
}

/*
  A single, subtle page transition: content fades in and rises a few pixels when
  the route changes. It exists to make navigation feel like an app, not to
  decorate. Implemented as a CSS animation (see index.css) rather than an
  animation library. One fade doesn't justify shipping ~40KB to a mobile-first
  app. The `key` restarts the animation on each route; reduced-motion is honored
  globally in index.css, which zeroes animation duration.
*/
export function PageTransition({ routeKey, children }: PageTransitionProps) {
  return (
    <div key={routeKey} className="animate-page-in">
      {children}
    </div>
  );
}
